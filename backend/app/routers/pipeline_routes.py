from fastapi import APIRouter
from pydantic import BaseModel
from app.orchestration.graph import pipeline
from app.routers.websocket_routes import manager
from app.routers.incidents_routes import add_incident

from typing import Optional

router = APIRouter()

class PipelineInput(BaseModel):
    message: str
    user_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    cell_tower_id: Optional[str] = None
    bssid: Optional[str] = None
    reporter_lat: Optional[float] = None
    reporter_lng: Optional[float] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None

@router.post("/run")
async def run_pipeline(payload: PipelineInput):
    result = await pipeline.ainvoke({
        "message": payload.message,
        "user_id": payload.user_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "accuracy": payload.accuracy,
        "cell_tower_id": payload.cell_tower_id,
        "bssid": payload.bssid,
        "reporter_lat": payload.reporter_lat,
        "reporter_lng": payload.reporter_lng,
        "media_url": payload.media_url,
        "media_type": payload.media_type,
        "extracted": None, "incident": None, "resource_plan": None, "final_output": None,
    })
    final = result.get("final_output") or {}
    is_emergency = final.get("is_emergency", True)

    # Only save to CAD incidents and broadcast to emergency responders if this is an actual emergency
    if is_emergency and final.get("incident_id"):
        add_incident(final)
        await manager.broadcast({"type": "incident_update", "payload": final})

    return final