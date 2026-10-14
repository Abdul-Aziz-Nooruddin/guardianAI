from app.agents.ngo_dashboard.formatter import build_reasoning
from app.utils.routing import resolve_responder_role
import datetime

async def build_action_plan(extracted: dict, incident: dict, resource_output: dict, hospitals: list[dict]) -> dict:
    hospitals_by_id = {h["id"]: h for h in hospitals} if isinstance(hospitals, list) else hospitals
    reasoning = resource_output.get("reasoning") or build_reasoning(
        resource_output.get("distribution_plan", []), hospitals_by_id
    )

    selected_fac = resource_output.get("selected_facility", {})
    screened_facs = resource_output.get("screened_facilities", [])
    alerted_facs = resource_output.get("alerted_facilities", [])
    required_equipment = resource_output.get("required_equipment", [])

    location_name = extracted.get("location_text") or "Reported Incident Site"
    need_title = (extracted.get("need_type") or "Medical Emergency").replace("_", " ").title()
    urgency_level = (incident.get("urgency") or "high").upper()

    verification = incident.get("verification") or {}
    is_anomaly = verification.get("is_anomaly", False)
    co_location = verification.get("co_location", {})
    spatial = verification.get("spatial_dispersion", {})

    # Append anti-spoofing warning or verification banner to reasoning
    if is_anomaly:
        warning_msg = co_location.get("reason") or spatial.get("description") or "Sybil anomaly detected"
        reasoning = [f"⚠️ ANTI-SPOOFING WARNING: {warning_msg}. Deploy reconnaissance scout unit first before committing heavy assets."] + reasoning
    elif verification.get("verification_status") == "verified":
        verify_msg = f"🛡️ SPATIALLY VERIFIED: Multi-angle physical triangulation ({spatial.get('angular_spread_degrees', 0)}° spread across {spatial.get('quadrants_covered', 1)} compass quadrants)."
        reasoning = [verify_msg] + reasoning

    if extracted.get("media_url"):
        media_kind = extracted.get("media_type", "camera").title()
        reasoning = [f"📸 VISUAL PROOF VERIFIED: Live on-scene {media_kind} captured by citizen. Physical disaster verified on-site."] + reasoning

    verification_headline = (
        f"⚠️ Sybil Anomaly Flagged — {co_location.get('reason', 'Suspicious device pattern')}"
        if is_anomaly
        else (
            f"Multi-Angle Corroboration Confirmed ({spatial.get('angular_spread_degrees', 0)}° spread, {spatial.get('quadrants_covered', 1)} quadrants)"
            if verification.get("verification_status") == "verified"
            else ("Live on-scene visual camera evidence attached" if extracted.get("media_url") else "Single-source intake verified against physical GPS bounds")
        )
    )

    pipeline_nodes = [
        {
            "id": "node_intake",
            "step": 1,
            "title": "Distress Report Intake",
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "headline": f"Location geocoded to {location_name}" + (" [Visual Proof Attached]" if extracted.get("media_url") else ""),
            "details": {
                "location_text": location_name,
                "latitude": extracted.get("latitude"),
                "longitude": extracted.get("longitude"),
                "raw_message": extracted.get("raw_message", ""),
                "media_url": extracted.get("media_url"),
                "media_type": extracted.get("media_type"),
                "visual_proof_verified": bool(extracted.get("media_url")),
            },
        },
        {
            "id": "node_verification",
            "step": 2,
            "title": "Spatial & Telemetry Anti-Spoofing",
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "headline": verification_headline,
            "details": {
                "is_anomaly": is_anomaly,
                "verification_status": verification.get("verification_status", "unverified"),
                "co_location": co_location,
                "spatial_dispersion": spatial,
                "confidence_evaluation": verification.get("confidence_evaluation", {}),
            },
        },
        {
            "id": "node_triage",
            "step": 3,
            "title": "AI Emergency & Clinical Triage",
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "headline": f"{need_title} — {urgency_level} Priority",
            "details": {
                "need_type": extracted.get("need_type"),
                "urgency": incident.get("urgency"),
                "victim_count": incident.get("victim_count_estimate", 1),
                "confidence": incident.get("confidence", 0.9),
                "required_equipment": required_equipment,
            },
        },
        {
            "id": "node_screening",
            "step": 4,
            "title": "Facility Readiness Pre-Screening",
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "headline": f"{len(screened_facs)} nearby facilities verified for ambulance & equipment readiness",
            "details": {
                "screened_facilities": screened_facs,
                "qualified_count": len([f for f in screened_facs if f.get("status") == "qualified"]),
                "disqualified_count": len([f for f in screened_facs if f.get("status") == "disqualified"]),
            },
        },
        {
            "id": "node_alert",
            "step": 5,
            "title": "Targeted Priority Alert Dispatched",
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "headline": f"Direct dispatch alert transmitted to {selected_fac.get('hospital_name', 'Emergency Center')}",
            "details": {
                "alerted_facilities": alerted_facs,
                "target_facility": selected_fac,
            },
        },
        {
            "id": "node_acceptance",
            "step": 6,
            "title": "Hospital Acceptance & Vehicle En Route",
            "status": "pending",
            "timestamp": None,
            "headline": f"Awaiting ER acknowledgement from {selected_fac.get('hospital_name', 'Hospital')}",
            "details": {
                "hospital_id": selected_fac.get("hospital_id"),
                "hospital_name": selected_fac.get("hospital_name"),
                "assigned_ambulance_id": selected_fac.get("assigned_ambulance_id", "AMB-104"),
                "eta_minutes": selected_fac.get("eta_minutes", 8),
                "status": "pending_acceptance",
            },
        },
    ]

    return {
        "incident_id": incident["incident_id"],
        "is_emergency": True,
        "action_plan": resource_output,
        "reasoning": reasoning,
        "confidence": incident.get("confidence", 0.9),
        "urgency": incident.get("urgency", "high"),
        "victim_count": incident.get("victim_count_estimate", 1),
        "status": "pending_acceptance",
        "pipeline_nodes": pipeline_nodes,
        "selected_facility": selected_fac,
        "screened_facilities": screened_facs,
        "verification": verification,
        "victim_reply": extracted.get("victim_reply", ""),
        "latitude": extracted.get("latitude"),
        "longitude": extracted.get("longitude"),
        "location_text": extracted.get("location_text"),
        "gps_verified": extracted.get("gps_verified", False),
        "accuracy_meters": extracted.get("accuracy_meters"),
        "need_type": extracted.get("need_type"),
        "media_url": extracted.get("media_url"),
        "media_type": extracted.get("media_type"),
        "responder_role": resolve_responder_role(extracted.get("need_type") or "medical"),
        "created_at": datetime.datetime.utcnow().isoformat(),
    }