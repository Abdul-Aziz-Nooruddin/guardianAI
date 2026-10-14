import uuid
import datetime
from qdrant_client.models import PointStruct
from app.agents.emergency_intelligence.embeddings import get_embedding
from app.db.qdrant_client import client, ensure_collection, COLLECTION_NAME
from app.agents.emergency_intelligence.verification import record_and_verify_telemetry

SIMILARITY_THRESHOLD = 0.82

ensure_collection()

async def dedup_and_cluster(extracted_report: dict) -> dict:
    need_type = extracted_report.get("need_type", "other")
    location_text = extracted_report.get("location_text", "")
    lat = extracted_report.get("latitude") or 17.4156
    lng = extracted_report.get("longitude") or 78.4347

    # need_type is repeated to weight it heavily — prevents different incident types
    # at the same location from accidentally clustering together
    text_for_embedding = f"{need_type} {need_type} incident at {location_text}"
    vector = get_embedding(text_for_embedding)

    search_results = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=5,
    )

    matching_incident_id = None
    cluster_size = 1
    for result in search_results:
        # extra safety: only merge if need_type also matches exactly
        payload = result.payload or {}
        if result.score >= SIMILARITY_THRESHOLD and payload.get("need_type") == need_type:
            matching_incident_id = payload.get("incident_id")
            cluster_size = payload.get("cluster_size", 1) + 1
            break

    incident_id = matching_incident_id or f"inc_{uuid.uuid4().hex[:8]}"

    point_id = str(uuid.uuid4())
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "incident_id": incident_id,
                    "location_text": location_text,
                    "need_type": need_type,
                    "cluster_size": cluster_size,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                },
            )
        ],
    )

    raw_confidence = min(0.6 + (cluster_size * 0.08), 0.98)

    # Telemetry and anti-spoofing verification (Physical Co-Location & Spatial Dispersion)
    report_telemetry = {
        "user_id": extracted_report.get("user_id", "anon_citizen"),
        "reporter_lat": extracted_report.get("reporter_lat", lat),
        "reporter_lng": extracted_report.get("reporter_lng", lng),
        "cell_tower_id": extracted_report.get("cell_tower_id"),
        "bssid": extracted_report.get("bssid"),
    }

    verification = record_and_verify_telemetry(
        incident_id=incident_id,
        incident_lat=lat,
        incident_lng=lng,
        report_telemetry=report_telemetry,
        base_confidence=raw_confidence,
        cluster_size=cluster_size,
    )

    effective_cluster = verification.get("effective_cluster_size", cluster_size)
    final_confidence = verification.get("confidence_evaluation", {}).get("final_confidence", raw_confidence)

    # Use citizen's explicit reported victim count, defaulting to 1 (or multi-witness cluster size)
    raw_victim_count = extracted_report.get("victim_count")
    if isinstance(raw_victim_count, (int, float)) and raw_victim_count > 0:
        victim_count_est = int(raw_victim_count)
    else:
        victim_count_est = max(1, effective_cluster)

    return {
        "incident_id": incident_id,
        "cluster_size": effective_cluster,
        "raw_cluster_size": cluster_size,
        "victim_count_estimate": victim_count_est,
        "confidence": final_confidence,
        "urgency": extracted_report.get("urgency", "medium"),
        "is_stale": False,
        "verification": verification,
    }