from fastapi import APIRouter, Depends, HTTPException, Cookie
from sqlalchemy.orm import Session
from database import get_db
from jose import JWTError, jwt
import models, security
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

def get_current_user_from_cookie(access_token: Optional[str] = Cookie(None)):
    """Dependency: validates the HttpOnly JWT cookie."""
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        token = access_token.removeprefix("Bearer ")
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class IncidentResponse(BaseModel):
    incident_id: str
    trigger_event: str
    severity_level: str
    autonomous_action: str
    outcome: str
    timestamp: datetime

    model_config = {"from_attributes": True}

class BlacklistResponse(BaseModel):
    id: str
    url: str
    reason: str
    risk_score: str
    timestamp: datetime

    model_config = {"from_attributes": True}

@router.get("/", response_model=List[IncidentResponse])
def get_incidents(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_from_cookie)
):
    """
    Returns the most recent incident log entries, ordered newest first.
    """
    incidents = (
        db.query(models.IncidentLog)
        .order_by(models.IncidentLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        IncidentResponse(
            incident_id=inc.incident_id,
            trigger_event=inc.trigger_event,
            severity_level=inc.severity_level.value,
            autonomous_action=inc.autonomous_action,
            outcome=inc.outcome.value,
            timestamp=inc.timestamp,
        )
        for inc in incidents
    ]

@router.get("/blacklist", response_model=List[BlacklistResponse])
def get_blacklist(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_from_cookie)
):
    """
    Returns the community blacklist (Threat Intelligence).
    """
    blacklist = (
        db.query(models.BlacklistedURL)
        .order_by(models.BlacklistedURL.timestamp.desc())
        .limit(limit)
        .all()
    )
    return blacklist
