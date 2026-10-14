from sqlalchemy import Column, String, Integer, Float, DateTime, JSON
from sqlalchemy.orm import declarative_base
import datetime, uuid

Base = declarative_base()

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String)
    area = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    victim_count = Column(Integer, default=0)
    urgency = Column(String)
    confidence = Column(Float)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    reasoning = Column(JSON, nullable=True)