import asyncio
from app.agents.ngo_dashboard.agent import build_action_plan

async def run_test():
    extracted = {
        "location_text": "Banjara Hills Road No 1",
        "latitude": 17.4156,
        "longitude": 78.4347,
        "need_type": "medical",
        "victim_reply": "Emergency team notified.",
    }
    incident = {
        "incident_id": "inc_test_1",
        "urgency": "critical",
        "victim_count_estimate": 2,
        "confidence": 0.94,
    }
    resource_output = {
        "distribution_plan": [],
        "screened_facilities": [
            {"hospital_id": "h_c", "name": "Apollo Emergency", "status": "qualified", "reason": "Ready"}
        ],
        "alerted_facilities": [{"hospital_id": "h_c", "name": "Apollo Emergency"}],
        "selected_facility": {"hospital_id": "h_c", "hospital_name": "Apollo Emergency", "eta_minutes": 7},
        "required_equipment": ["trauma_unit", "emergency_surgery"],
    }
    hospitals = [{"id": "h_c", "name": "Apollo Emergency"}]

    plan = await build_action_plan(extracted, incident, resource_output, hospitals)
    assert len(plan["pipeline_nodes"]) == 5
    assert plan["pipeline_nodes"][0]["status"] == "completed"
    assert plan["pipeline_nodes"][4]["status"] == "pending"
    assert plan["status"] == "pending_acceptance"
    print("NGO Dashboard 5-node action plan test passed ✓")

if __name__ == "__main__":
    asyncio.run(run_test())
