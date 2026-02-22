from sqlalchemy import Column, String, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
import uuid
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    SYS_ADMIN = "SYS_ADMIN"
    WS_OWNER = "WS_OWNER"
    AI_ENG = "AI_ENG"
    QA_LEAD = "QA_LEAD"
    STAKEHOLDER = "STAKEHOLDER"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    entra_id = Column(String, unique=True, nullable=False, index=True) # Subject ID from Entra
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STAKEHOLDER)
    avatar_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
