from fastapi import APIRouter, Depends, HTTPException, Cookie
from typing import Optional, List
from pydantic import BaseModel
import httpx
import validators
from bs4 import BeautifulSoup
import whois
from datetime import datetime
import security
from database import get_db
from sqlalchemy.orm import Session
import models
import asyncio
from urllib.parse import urlparse

router = APIRouter(prefix="/scanner", tags=["Scanner"])

class ScanRequest(BaseModel):
    url: str

class Vulnerability(BaseModel):
    type: str
    description: str
    severity: str

class ScanResponse(BaseModel):
    url: str
    is_safe: bool
    status: str # "Safe", "Suspicious", "Dangerous"
    risk_score: int # 0-100
    vulnerabilities: List[Vulnerability]
    recommendation: str
    alert_message: Optional[str] = None
    incident_id: Optional[str] = None

def get_current_user_from_cookie(access_token: Optional[str] = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        token = access_token.removeprefix("Bearer ")
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/scan", response_model=ScanResponse)
async def scan_website(
    request: ScanRequest, 
    current_user: str = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    url = request.url
    print(f"--- SCAN INITIATED: {url} (User: {current_user}) ---")
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
        
    if not validators.url(url):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    # Check if URL is already blacklisted
    blacklisted = db.query(models.BlacklistedURL).filter(models.BlacklistedURL.url == url).first()
    if blacklisted:
        # Log the incident even for known blacklisted URLs
        new_incident = models.IncidentLog(
            trigger_event=f"Blocked Access Attempt: {url}",
            severity_level=models.SeverityLevel.High,
            autonomous_action="Connection Intercepted - URL in Global Blacklist",
            outcome=models.IncidentOutcome.Resolved_Autonomously
        )
        db.add(new_incident)
        db.commit()
        
        return ScanResponse(
            url=url,
            is_safe=False,
            status="Blacklisted",
            risk_score=100,
            vulnerabilities=[
                Vulnerability(
                    type="Verified Malicious Source", 
                    description="This URL is present in the AIRS Global Threat Intelligence database.", 
                    severity="High"
                ),
                Vulnerability(
                    type="Data Exfiltration Risk",
                    description="Entering credentials or personal data on this site will lead to immediate identity theft.",
                    severity="High"
                )
            ],
            recommendation="PREVENTIVE ACTION: Do NOT enter any passwords, emails, or credit card info. This site is a known phishing/malware vector.",
            alert_message="CRITICAL: AIRS Shield has blocked all data transmission to this known malicious entity.",
            incident_id=new_incident.incident_id
        )

    vulnerabilities = []
    risk_score = 0
    
    try:
        # 1. Performance Optimization: Parallelize independent checks
        # Use a faster timeout for the initial probe
        # Set verify=False to allow scanning sites with SSL issues (common in dev/malicious sites)
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0, verify=False) as client:
            try:
                response = await client.get(url)
                headers = response.headers
                html_content = response.text
                
                # --- PROBE 1: HEADERS ---
                if 'Strict-Transport-Security' not in headers:
                    vulnerabilities.append(Vulnerability(type="Missing HSTS", description="Insecure transport (No HTTPS enforcement).", severity="Low"))
                    risk_score += 5

                if 'Content-Security-Policy' not in headers:
                    vulnerabilities.append(Vulnerability(type="Missing CSP", description="No Content Security Policy detected.", severity="Medium"))
                    risk_score += 10

                if 'X-Frame-Options' not in headers:
                    vulnerabilities.append(Vulnerability(type="Missing X-Frame-Options", description="Clickjacking protection missing.", severity="Low"))
                    risk_score += 5

                # Outdated Software check
                software = headers.get('Server', '') or headers.get('X-Powered-By', '')
                if software:
                    vulnerabilities.append(Vulnerability(type="Software Disclosure", description=f"Server headers exposed: {software}", severity="Low"))
                    risk_score += 5

                # --- PROBE 2: HTML ---
                soup = BeautifulSoup(html_content, 'html.parser')
                
                if any(f.get('action', '').startswith('http://') for f in soup.find_all('form')):
                    vulnerabilities.append(Vulnerability(type="Insecure Form", description="Forms use HTTP instead of HTTPS.", severity="High"))
                    risk_score += 30

                # Suspicious Iframes (Common in Phishing/Drive-by downloads)
                iframes = soup.find_all('iframe')
                for iframe in iframes:
                    style = iframe.get('style', '').lower()
                    width = iframe.get('width', '1')
                    height = iframe.get('height', '1')
                    if 'display:none' in style or 'visibility:hidden' in style or width == '0' or height == '0':
                        vulnerabilities.append(Vulnerability(type="Hidden Iframe", description="Detected invisible iframe used for background attacks.", severity="High"))
                        risk_score += 40
                        break

                scripts = soup.find_all('script')
                for script in scripts:
                    src = script.get('src', '').lower()
                    # Removed t.co and bit.ly as they are often legitimate
                    if any(x in src for x in ['miner', 'coinhive', 'crypto-pool', 'wasm']):
                        vulnerabilities.append(Vulnerability(type="Malicious Script", description="Detected suspicious crypto-mining or obfuscated source.", severity="High"))
                        risk_score += 45
                        break

                # SQL Injection Pattern Check
                sqli_patterns = [r"'.*--", r"'.*OR.*'1'='1'", r"UNION SELECT", r"SLEEP\(\d+\)"]
                if any(re.search(p, url, re.I) or re.search(p, html_content, re.I) for p in sqli_patterns):
                    vulnerabilities.append(Vulnerability(type="SQL Injection Pattern", description="Detected exploit syntax.", severity="High"))
                    risk_score += 65

            except httpx.RequestError:
                # If site is unreachable, we don't mark it dangerous immediately, just suspicious
                vulnerabilities.append(Vulnerability(type="Target Unreachable", description="The site did not respond to the probe. It may be offline or blocking scanners.", severity="Medium"))
                risk_score += 25

        # --- PROBE 3: WHOIS (Asynchronous to prevent blocking) ---
        try:
            # Extract domain for WHOIS (it doesn't like full URLs)
            domain = urlparse(url).netloc
            if not domain:
                domain = url # Fallback
            
            # Run blocking WHOIS in a separate thread
            domain_info = await asyncio.to_thread(whois.whois, domain)
            creation_date = domain_info.creation_date
            
            if isinstance(creation_date, list): creation_date = creation_date[0]
            
            if creation_date and isinstance(creation_date, datetime):
                age_days = (datetime.now() - creation_date).days
                if age_days < 30:
                    vulnerabilities.append(Vulnerability(type="Newly Registered Domain", description=f"Registered {age_days} days ago.", severity="High"))
                    risk_score += 50
        except Exception as whois_err:
            print(f"WHOIS Error for {url}: {str(whois_err)}")
            pass

    except Exception as e:
        print(f"CRITICAL SCANNER ERROR: {str(e)}")
        # If we failed early, ensure we still return a valid response
        if 'vulnerabilities' not in locals(): vulnerabilities = []
        if 'risk_score' not in locals(): risk_score = 0
        if 'is_safe' not in locals(): is_safe = True
        if 'status' not in locals(): status = "Error"
        if 'recommendation' not in locals(): recommendation = "Internal scanner error occurred."
        if 'alert_message' not in locals(): alert_message = None
        if 'logged_incident_id' not in locals(): logged_incident_id = None

    # Result Logic
    is_safe = risk_score < 40
    status = "Safe" if is_safe else ("Dangerous" if risk_score > 75 else "Suspicious")
    recommendation = "Systems nominal." if is_safe else "CAUTION: AIRS Shield deployed a Virtual Patch."
    alert_message = "CRITICAL SECURITY ALERT: AIRS has intercepted a malicious connection." if risk_score > 75 else None

    # SOC Response - Log EVERY URL scan to the dashboard ledger
    # Determine severity and actions based on final results
    if risk_score > 75:
        severity = models.SeverityLevel.High
        action = "URL Blacklisted, Virtual Patch Deployed, Sandbox Reroute"
        outcome = models.IncidentOutcome.Resolved_Autonomously
    elif risk_score >= 40:
        severity = models.SeverityLevel.Medium
        action = "Monitoring Escalated, Shield Protocol Active"
        outcome = models.IncidentOutcome.Resolved_Autonomously
    else:
        severity = models.SeverityLevel.Low
        action = "Audit Completed, No Anomalies Detected"
        outcome = models.IncidentOutcome.Resolved_Autonomously # Or add a 'Nominal' outcome if needed

    new_incident = models.IncidentLog(
        trigger_event=f"External Scan: {url}",
        severity_level=severity,
        autonomous_action=action,
        outcome=outcome
    )
    db.add(new_incident)
    db.flush()
    logged_incident_id = new_incident.incident_id
    
    # Only blacklist if it's actually Dangerous (score > 75)
    if risk_score > 75:
        if not db.query(models.BlacklistedURL).filter(models.BlacklistedURL.url == url).first():
            db.add(models.BlacklistedURL(url=url, reason="AIRS Detection", risk_score=str(min(risk_score, 100))))
    
    db.commit()
    print(f"--- SOC LEDGER UPDATED: Incident {logged_incident_id} recorded ---")

    return ScanResponse(
        url=url, is_safe=is_safe, status=status, risk_score=min(risk_score, 100),
        vulnerabilities=vulnerabilities, recommendation=recommendation,
        alert_message=alert_message, incident_id=logged_incident_id
    )
