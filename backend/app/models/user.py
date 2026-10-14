from sqlalchemy import Column, String
from app.models.incident import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String)
    mode = Column(String)   # "victim" or "responder"
    role = Column(String, nullable=True)  # ngo, fire_brigade, medical, police, volunteer_coordinator