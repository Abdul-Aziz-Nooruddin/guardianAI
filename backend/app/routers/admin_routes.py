from fastapi import APIRouter
from app.agents.resource_finder import agent as resource_agent
from app.agents.emergency_intelligence.verification import clear_telemetry_cache
from app.db.qdrant_client import client, COLLECTION_NAME, ensure_collection
from app.routers.incidents_routes import clear_incidents
from qdrant_client.models import Distance, VectorParams

router = APIRouter()

@router.post("/reset")
def reset_demo_state():
    # 1. Reload hospital capacity fresh from the JSON file
    resource_agent._HOSPITALS_CACHE = None
    resource_agent.load_hospitals()

    # 2. Clear in-memory incidents store and telemetry cache
    clear_incidents()
    clear_telemetry_cache()

    # 3. Wipe and recreate the Qdrant collection so old test incidents don't linger
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    try:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )
    except Exception:
        pass

    return {"status": "reset complete"}