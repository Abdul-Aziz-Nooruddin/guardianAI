from sqlalchemy import Column, String, Integer, Float
from app.models.incident import Base

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(String, primary_key=True)
    name = Column(String)
    area = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    total_beds = Column(Integer)
    available_beds = Column(Integer)
    icu_total = Column(Integer)
    icu_available = Column(Integer)
    specialists = Column(String)