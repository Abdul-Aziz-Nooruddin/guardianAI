import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.config import settings

COLLECTION_NAME = "victim_reports"
VECTOR_SIZE = 768  # nomic-embed-text output dimension

def init_client() -> QdrantClient:
    try:
        c = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port, timeout=2)
        c.get_collections()
        return c
    except Exception:
        # Fallback to local storage directory or in-memory
        storage_path = os.path.abspath("storage")
        os.makedirs(storage_path, exist_ok=True)
        try:
            return QdrantClient(path=storage_path)
        except Exception:
            return QdrantClient(":memory:")

client = init_client()

def ensure_collection():
    try:
        collections = [c.name for c in client.get_collections().collections]
        if COLLECTION_NAME not in collections:
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
    except Exception as e:
        print(f"Warning: ensure_collection: {e}")