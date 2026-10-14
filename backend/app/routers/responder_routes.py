from typing import Optional
import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from app.routers.websocket_routes import manager
from app.agents.resource_finder.agent import (
    load_hospitals,
    load_fire_stations,
    load_police_stations,
)
from app.routers.incidents_routes import update_incident_acceptance

router = APIRouter()

decision_log = []
acceptance_log = {}

@router.get("/roles")
def get_roles():
    return [
        "ngo",
        "fire_brigade",
        "medical",
        "police",
        "disaster_management",
        "volunteer_coordinator"
    ]

class Decision(BaseModel):
    incident_id: str
    decision: str  # "approved" or "overridden"

@router.post("/decision")
def log_decision(payload: Decision):
    decision_log.append(payload.dict())
    return {"status": "logged", "total_logged": len(decision_log)}

class AcceptIncidentPayload(BaseModel):
    incident_id: str
    responder_id: str
    responder_name: str
    responder_role: Optional[str] = "medical"
    ambulance_id: Optional[str] = "AMB-104"
    eta_minutes: Optional[int] = 7
    notes: Optional[str] = "Emergency team dispatched with trauma paramedic"

@router.post("/accept")
async def accept_incident(payload: AcceptIncidentPayload):
    role = (payload.responder_role or "medical").lower()

    if role == "fire_brigade":
        fire_stations = load_fire_stations()
        for s in fire_stations:
            if s["id"] == payload.responder_id or s["name"] == payload.responder_name:
                if s.get("fire_engines_available", 0) > 0:
                    s["fire_engines_available"] -= 1
                break
    elif role == "police":
        police_stations = load_police_stations()
        for p in police_stations:
            if p["id"] == payload.responder_id or p["name"] == payload.responder_name:
                if p.get("patrol_cars_available", 0) > 0:
                    p["patrol_cars_available"] -= 1
                elif p.get("tow_trucks_available", 0) > 0:
                    p["tow_trucks_available"] -= 1
                break
    else:
        # Decrement live hospital inventory
        hospitals = load_hospitals()
        for h in hospitals:
            if h["id"] == payload.responder_id or h["name"] == payload.responder_name:
                if h.get("ambulances_available", 0) > 0:
                    h["ambulances_available"] -= 1
                if h.get("available_beds", 0) > 0:
                    h["available_beds"] -= 1
                break

    accepted_record = {
        "incident_id": payload.incident_id,
        "responder_id": payload.responder_id,
        "responder_name": payload.responder_name,
        "responder_role": payload.responder_role,
        "ambulance_id": payload.ambulance_id,
        "eta_minutes": payload.eta_minutes,
        "status": "accepted_en_route",
        "notes": payload.notes,
        "accepted_at": datetime.datetime.utcnow().isoformat(),
    }
    acceptance_log[payload.incident_id] = accepted_record
    
    # Update persistent incidents store
    update_incident_acceptance(payload.incident_id, accepted_record)

    # Broadcast real-time update to all active dashboards and victim screens
    await manager.broadcast({
        "type": "incident_accepted",
        "payload": accepted_record,
    })

    return {
        "status": "accepted",
        "record": accepted_record,
    }

@router.get("/acceptance/{incident_id}")
def get_incident_acceptance(incident_id: str):
    record = acceptance_log.get(incident_id)
    if record:
        return {"status": "accepted", "record": record}
    return {"status": "pending"}

@router.get("/history")
def get_responder_history():
    return {
        "decisions": decision_log,
        "acceptances": list(acceptance_log.values()),
    }