from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter()

INCIDENTS_CACHE: list[dict] = []

def add_incident(incident: dict):
    # If incident already exists by incident_id, update it; otherwise prepend
    for i, existing in enumerate(INCIDENTS_CACHE):
        if existing.get("incident_id") == incident.get("incident_id"):
            INCIDENTS_CACHE[i] = incident
            return
    INCIDENTS_CACHE.insert(0, incident)

def update_incident_acceptance(incident_id: str, acceptance: dict):
    for incident in INCIDENTS_CACHE:
        if incident.get("incident_id") == incident_id:
            incident["status"] = "accepted_en_route"
            incident["acceptance"] = acceptance
            # update node 5 in pipeline_nodes
            if "pipeline_nodes" in incident:
                for node in incident["pipeline_nodes"]:
                    if node.get("id") == "node_acceptance":
                        node["status"] = "completed"
                        node["headline"] = f"Accepted by {acceptance.get('responder_name')} (Unit {acceptance.get('ambulance_id')})"
                        node["details"] = acceptance
            break

def clear_incidents():
    global INCIDENTS_CACHE
    INCIDENTS_CACHE = []

@router.delete("/clear")
def clear_all_incidents():
    clear_incidents()
    return {"status": "cleared", "count": 0}

@router.get("/")
def list_incidents(role: Optional[str] = None):
    if not role or role in ("ngo", "disaster_management"):
        return INCIDENTS_CACHE
    return [i for i in INCIDENTS_CACHE if i.get("responder_role") == role]

@router.get("/{incident_id}")
def get_incident(incident_id: str):
    for incident in INCIDENTS_CACHE:
        if incident.get("incident_id") == incident_id:
            return incident
    raise HTTPException(status_code=404, detail="Incident not found")

from pydantic import BaseModel
from app.orchestration.graph import pipeline
from app.routers.websocket_routes import manager

class TelemetrySimulationRequest(BaseModel):
    scenario: str  # "sybil_colocation" | "authentic_spatial"
    incident_type: Optional[str] = "medical"
    location_name: Optional[str] = "Banjara Hills Road No 12"
    lat: Optional[float] = 17.4156
    lng: Optional[float] = 78.4350

@router.post("/simulate-telemetry")
async def simulate_telemetry_scenario(payload: TelemetrySimulationRequest):
    """
    Simulates multi-device submissions:
    - 'sybil_colocation': 3 devices sitting in the same room (identical Cell Tower & Wi-Fi BSSID, within 4m of each other)
    - 'authentic_spatial': 3 distinct witnesses surrounding the incident across different quadrants and cell towers
    """
    center_lat = payload.lat or 17.4156
    center_lng = payload.lng or 78.4350
    msg = f"Acute {payload.incident_type} emergency near {payload.location_name}"

    if payload.scenario == "sybil_colocation":
        # 3 devices on the same desk/room
        devices = [
            {"user_id": "device_farm_unit_1", "offset_lat": 0.00000, "offset_lng": 0.00000, "tower": "CELL-HYD-CENTRAL-9", "bssid": "ac:8b:a9:12:00:11"},
            {"user_id": "device_farm_unit_2", "offset_lat": 0.00003, "offset_lng": 0.00002, "tower": "CELL-HYD-CENTRAL-9", "bssid": "ac:8b:a9:12:00:11"},
            {"user_id": "device_farm_unit_3", "offset_lat": 0.00002, "offset_lng": 0.00004, "tower": "CELL-HYD-CENTRAL-9", "bssid": "ac:8b:a9:12:00:11"},
        ]
    else:
        # Authentic crowd: 3 witnesses positioned in North-East, South-West, South-East quadrants
        devices = [
            {"user_id": "citizen_witness_north", "offset_lat": 0.0025, "offset_lng": 0.0018, "tower": "TOWER-BANJARA-N1", "bssid": "50:d4:f7:88:12:a1"},
            {"user_id": "citizen_witness_southwest", "offset_lat": -0.0031, "offset_lng": -0.0022, "tower": "TOWER-JUBILEE-SW4", "bssid": "24:a0:74:33:99:b2"},
            {"user_id": "citizen_witness_southeast", "offset_lat": -0.0019, "offset_lng": 0.0035, "tower": "TOWER-PANJAGUTTA-E2", "bssid": "78:92:9c:44:aa:c3"},
        ]

    final_incident = None
    for d in devices:
        rep_lat = center_lat + d["offset_lat"]
        rep_lng = center_lng + d["offset_lng"]
        result = await pipeline.ainvoke({
            "message": msg,
            "user_id": d["user_id"],
            "latitude": center_lat,
            "longitude": center_lng,
            "accuracy": 4.5,
            "cell_tower_id": d["tower"],
            "bssid": d["bssid"],
            "reporter_lat": rep_lat,
            "reporter_lng": rep_lng,
            "extracted": None, "incident": None, "resource_plan": None, "final_output": None,
        })
        final_incident = result["final_output"]

    if final_incident:
        add_incident(final_incident)
        await manager.broadcast({"type": "incident_update", "payload": final_incident})

    return final_incident