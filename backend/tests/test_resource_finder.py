import asyncio
from app.agents.resource_finder.agent import match_resources

async def run_test():
    incident = {
        "incident_id": "inc_001",
        "victim_count_estimate": 18,
        "urgency": "critical",
        "need_type": "medical",
    }
    result = await match_resources(incident, {"latitude": 17.4374, "longitude": 78.4482})
    print(result)
    assert sum(d["victims_assigned"] for d in result["distribution_plan"]) <= 18
    print("Resource Finder test passed ✓")

if __name__ == "__main__":
    asyncio.run(run_test())