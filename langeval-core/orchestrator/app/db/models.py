
from sqlalchemy import Column, String, Float, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    agent_id = Column(String, nullable=True)
    status = Column(String, default="queued")
    current_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # JSON fields for flexible storage
    metadata_info = Column(JSON, default={}) # Renamed to avoid reserved word conflict if any
    metrics = Column(JSON, default={})
    created_by = Column(JSON, default={}) 
