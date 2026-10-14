from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.resource_finder.agent import match_resources

router = APIRouter()

class IncidentInput(BaseModel):
    incident_id: str
    victim_count_estimate: int
    urgency: str
    need_type: str = "medical"
    latitude: float | None = None
    longitude: float | None = None

@router.post("/match")
async def match(payload: IncidentInput):
    incident = payload.dict()
    location = None
    if payload.latitude and payload.longitude:
        location = {"latitude": payload.latitude, "longitude": payload.longitude}
    result = await match_resources(incident, location)
    return result