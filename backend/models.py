import uuid
import enum
from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class UserRole(enum.Enum):
    User = "User"
    Admin = "Admin"

class SeverityLevel(enum.Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"

class IncidentOutcome(enum.Enum):
    Resolved_Autonomously = "Resolved Autonomously"
    Escalated_to_Analyst = "Escalated to Analyst"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.User)
    verification_status = Column(Boolean, default=False)
    
    hashed_password = Column(String)
    mfa_secret = Column(String) # For PyOTP

class BlacklistedURL(Base):
    __tablename__ = "blacklisted_urls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    url = Column(String, unique=True, index=True)
    reason = Column(String)
    risk_score = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class IncidentLog(Base):
    __tablename__ = "incident_logs"

    incident_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    trigger_event = Column(Text)
    severity_level = Column(Enum(SeverityLevel), default=SeverityLevel.Low)
    autonomous_action = Column(Text)
    outcome = Column(Enum(IncidentOutcome), default=IncidentOutcome.Resolved_Autonomously)
    timestamp = Column(DateTime, default=datetime.utcnow)
