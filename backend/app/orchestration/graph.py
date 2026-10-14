import json
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional

from app.agents.victim_assistance.agent import process_victim_message
from app.agents.emergency_intelligence.agent import dedup_and_cluster
from app.agents.resource_finder.agent import match_resources
from app.agents.ngo_dashboard.agent import build_action_plan

class PipelineState(TypedDict):
    message: str
    user_id: str
    latitude: Optional[float]
    longitude: Optional[float]
    accuracy: Optional[float]
    cell_tower_id: Optional[str]
    bssid: Optional[str]
    reporter_lat: Optional[float]
    reporter_lng: Optional[float]
    media_url: Optional[str]
    media_type: Optional[str]
    extracted: Optional[dict]
    incident: Optional[dict]
    resource_plan: Optional[dict]
    final_output: Optional[dict]

def load_hospitals():
    with open("data/mock_hospitals.json") as f:
        return json.load(f)

async def intake_node(state: PipelineState) -> PipelineState:
    state["extracted"] = await process_victim_message(
        message=state["message"],
        user_id=state["user_id"],
        latitude=state.get("latitude"),
        longitude=state.get("longitude"),
        accuracy=state.get("accuracy"),
        cell_tower_id=state.get("cell_tower_id"),
        bssid=state.get("bssid"),
        reporter_lat=state.get("reporter_lat"),
        reporter_lng=state.get("reporter_lng"),
        media_url=state.get("media_url"),
        media_type=state.get("media_type"),
    )
    # If classified as non-emergency (e.g. "how are you", casual greeting, testing)
    if not state["extracted"].get("is_emergency", True):
        state["final_output"] = {
            "is_emergency": False,
            "incident_id": None,
            "victim_reply": state["extracted"].get("victim_reply"),
            "intent": state["extracted"].get("intent", "greeting"),
            "location_text": state["extracted"].get("location_text", "Non-Emergency Inquiry"),
            "need_type": "none",
            "urgency": "none",
            "status": "non_emergency_acknowledged",
            "raw_message": state["message"],
        }
    return state

def check_emergency(state: PipelineState) -> str:
    extracted = state.get("extracted") or {}
    if extracted.get("is_emergency", True):
        return "emergency"
    return "non_emergency"

async def dedup_node(state: PipelineState) -> PipelineState:
    extracted = state.get("extracted") or {}
    state["incident"] = await dedup_and_cluster(extracted)
    return state

async def match_node(state: PipelineState) -> PipelineState:
    extracted = state.get("extracted") or {}
    incident = state.get("incident") or {}
    location = {
        "latitude": extracted.get("latitude"),
        "longitude": extracted.get("longitude"),
    }
    incident_with_need = {**incident, "need_type": extracted.get("need_type", "medical")}
    state["resource_plan"] = await match_resources(incident_with_need, location)
    return state

async def dashboard_node(state: PipelineState) -> PipelineState:
    hospitals = load_hospitals()
    extracted = state.get("extracted") or {}
    incident = state.get("incident") or {}
    resource_plan = state.get("resource_plan") or {}
    state["final_output"] = await build_action_plan(
        extracted, incident, resource_plan, hospitals
    )
    return state

def build_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("intake", intake_node)
    graph.add_node("dedup", dedup_node)
    graph.add_node("match", match_node)
    graph.add_node("dashboard", dashboard_node)

    graph.set_entry_point("intake")
    graph.add_conditional_edges(
        "intake",
        check_emergency,
        {
            "emergency": "dedup",
            "non_emergency": END,
        },
    )
    graph.add_edge("dedup", "match")
    graph.add_edge("match", "dashboard")
    graph.add_edge("dashboard", END)

    return graph.compile()

pipeline = build_graph()