from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean
import datetime, uuid
from app.models.incident import Base

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)
    raw_message = Column(String)
    language = Column(String)
    location_text = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    need_type = Column(String)
    is_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)