import asyncio
import json
import httpx
from pathlib import Path

API_URL = "http://localhost:8000/api/pipeline/run"
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "seed_victim_reports.json"

async def seed():
    with open(DATA_PATH) as f:
        reports = json.load(f)

    async with httpx.AsyncClient() as client:
        for report in reports:
            resp = await client.post(API_URL, json=report, timeout=30)
            print(report["message"][:50], "->", resp.status_code)
            await asyncio.sleep(1.5)

if __name__ == "__main__":
    asyncio.run(seed())