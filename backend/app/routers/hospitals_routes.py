from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.agents.resource_finder.agent import (
    get_hospitals_snapshot,
    get_hospital_by_id,
    update_hospital_telemetry,
)
from app.routers.websocket_routes import manager

router = APIRouter()

class HospitalUpdatePayload(BaseModel):
    ambulances_available: Optional[int] = None
    ambulance_ready: Optional[bool] = None
    available_beds: Optional[int] = None
    total_beds: Optional[int] = None
    icu_available: Optional[int] = None
    icu_total: Optional[int] = None
    status: Optional[str] = None
    auto_status: Optional[bool] = None
    equipment: Optional[List[str]] = None
    doctors_available: Optional[int] = None
    on_duty_doctors: Optional[List[str]] = None

@router.get("/")
def list_hospitals():
    """Retrieve current live capacity across all regional hospitals."""
    return get_hospitals_snapshot()

@router.get("/{hospital_id}")
def get_hospital(hospital_id: str):
    """Retrieve detailed operational telemetry for a specific hospital."""
    hospital = get_hospital_by_id(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.put("/{hospital_id}")
@router.patch("/{hospital_id}")
async def update_hospital(hospital_id: str, payload: HospitalUpdatePayload):
    """
    Update live facility readiness (e.g. ambulances on standby, ICU beds, trauma status).
    Broadcasts real-time WebSocket event to Responder Command Center, Citizen App, and AI Triage.
    """
    updated = update_hospital_telemetry(hospital_id, payload.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Broadcast real-time telemetry to all connected clients
    await manager.broadcast({
        "type": "hospital_update",
        "payload": updated
    })

    return {
        "status": "success",
        "message": f"Telemetry for {updated['name']} updated and broadcast in real time.",
        "hospital": updated
    }