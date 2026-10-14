import asyncio
from app.agents.emergency_intelligence.agent import dedup_and_cluster

async def run_test():
    report1 = {"location_text": "Ameerpet", "need_type": "medical", "urgency": "high"}
    report2 = {"location_text": "Ameerpet", "need_type": "medical", "urgency": "high"}

    result1 = await dedup_and_cluster(report1)
    result2 = await dedup_and_cluster(report2)

    print("Report 1:", result1)
    print("Report 2 (should cluster with 1):", result2)

    assert result1["incident_id"] == result2["incident_id"], "Expected same-area reports to cluster"
    print("Dedup test passed ✓")

if __name__ == "__main__":
    asyncio.run(run_test())