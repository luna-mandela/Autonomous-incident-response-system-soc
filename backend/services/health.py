import asyncio
import httpx
from sqlalchemy.orm import Session
import models
from database import SessionLocal

# TODO: Replace with the real school portal URL before deployment.
# Leaving as None disables health monitoring (prevents log spam during development).
TARGET_URL = None  # e.g. "https://portal.myschool.edu"

async def monitor_health():
    if not TARGET_URL:
        print("[Health Monitor] No TARGET_URL configured — monitoring disabled.")
        return

    while True:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(TARGET_URL, timeout=5.0)
                if response.status_code in [404, 500]:
                    log_downtime_incident(response.status_code)
        except Exception as e:
            log_downtime_incident(str(e))

        await asyncio.sleep(60)

def log_downtime_incident(details):
    db = SessionLocal()
    try:
        incident = models.IncidentLog(
            trigger_event=f"Downtime Incident Detected: {details}",
            severity_level=models.SeverityLevel.Medium,
            autonomous_action="Logged downtime.",
            outcome=models.IncidentOutcome.Resolved_Autonomously
        )
        db.add(incident)
        db.commit()
    finally:
        db.close()
