import asyncio
from app.orchestration.graph import pipeline

async def run_test():
    result = await pipeline.ainvoke({
        "message": "Ghar me pani aa gaya near Ameerpet, ambulance chahiye",
        "user_id": "u_test",
        "extracted": None, "incident": None, "resource_plan": None, "final_output": None,
    })
    print(result["final_output"])
    assert "reasoning" in result["final_output"]
    print("Full pipeline test passed ✓")

if __name__ == "__main__":
    asyncio.run(run_test())