from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sqlalchemy.orm import Session
import models
import random

analyzer = SentimentIntensityAnalyzer()

BANNED_KEYWORDS = ["kill", "die", "stupid", "idiot", "hate", "ugly"]

SECURITY_KNOWLEDGE = {
    "hsts": "HSTS (HTTP Strict Transport Security) is a security header that tells browsers to only communicate with a website using HTTPS, preventing downgrade attacks.",
    "csp": "Content Security Policy (CSP) is a security layer that helps detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks.",
    "xss": "Cross-Site Scripting (XSS) is a vulnerability where attackers inject malicious scripts into web pages viewed by other users.",
    "sql injection": "SQL Injection is a web security vulnerability that allows an attacker to interfere with the queries that an application makes to its database.",
    "blacklist": "The AIRS Blacklist is a community-driven database of verified malicious URLs. Once a site is on this list, our Shield will block access to it.",
    "whois": "WHOIS is a protocol used to query databases that store the registered users or assignees of an Internet resource, such as a domain name.",
    "risk score": "The AIRS Risk Score is a heuristic value (0-100) calculated by analyzing a site's headers, script sources, and domain age.",
    "help": "I am the AIRS AI Assistant. You can ask me about security headers (HSTS, CSP), vulnerabilities (XSS, SQLi), or how our scanner works."
}

def analyze_message(db: Session, sender_id: str, message: str) -> bool:
    """
    Analyzes message for bullying/toxicity.
    """
    is_toxic = False
    lower_msg = message.lower()
    if any(keyword in lower_msg for keyword in BANNED_KEYWORDS):
        is_toxic = True
    sentiment_dict = analyzer.polarity_scores(message)
    if sentiment_dict['compound'] <= -0.5:
        is_toxic = True
    if is_toxic:
        incident = models.IncidentLog(
            trigger_event=f"Toxic message detected: '{message}'",
            severity_level=models.SeverityLevel.High,
            autonomous_action="Message flagged and blocked by AI Brain.",
            outcome=models.IncidentOutcome.Resolved_Autonomously
        )
        db.add(incident)
        db.commit()
    return is_toxic

def generate_ai_response(message: str) -> str:
    """
    Generates a security-focused AI response based on keywords.
    """
    lower_msg = message.lower()
    
    # Check for specific knowledge matches
    for key, value in SECURITY_KNOWLEDGE.items():
        if key in lower_msg:
            return f"AIRS_INTEL: {value}"
    
    # General greetings or unidentified queries
    responses = [
        "I am currently monitoring the global threat pulse. How can I assist with your security audit?",
        "Our heuristic engines are nominal. Do you have a specific URL or vulnerability you'd like me to explain?",
        "Security is a continuous process. Remember to always check for missing CSP headers during your probes.",
        "I've recorded your query. I recommend running a full scan on any suspicious assets you encounter.",
        "AIRS Shield is active. My database shows no immediate local escalations. What's on your mind?"
    ]
    return random.choice(responses)
