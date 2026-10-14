import json
import math
from app.agents.resource_finder.rules import (
    haversine_km,
    derive_required_equipment,
    evaluate_hospital_readiness,
)

_HOSPITALS_CACHE = None
_FIRE_STATIONS_CACHE = None
_POLICE_STATIONS_CACHE = None

def load_hospitals() -> list[dict]:
    global _HOSPITALS_CACHE
    if _HOSPITALS_CACHE is None:
        with open("data/mock_hospitals.json") as f:
            _HOSPITALS_CACHE = json.load(f)
    return _HOSPITALS_CACHE

def load_fire_stations() -> list[dict]:
    global _FIRE_STATIONS_CACHE
    if _FIRE_STATIONS_CACHE is None:
        with open("data/mock_fire_stations.json") as f:
            _FIRE_STATIONS_CACHE = json.load(f)
    return _FIRE_STATIONS_CACHE

def load_police_stations() -> list[dict]:
    global _POLICE_STATIONS_CACHE
    if _POLICE_STATIONS_CACHE is None:
        with open("data/mock_police_stations.json") as f:
            _POLICE_STATIONS_CACHE = json.load(f)
    return _POLICE_STATIONS_CACHE

def get_hospitals_snapshot() -> list[dict]:
    return load_hospitals()

def get_hospital_by_id(hospital_id: str) -> dict | None:
    hospitals = load_hospitals()
    for h in hospitals:
        if h["id"] == hospital_id:
            return h
    return None

def compute_auto_facility_status(
    available_beds: int,
    total_beds: int,
    icu_available: int,
    icu_total: int,
    ambulances_available: int,
    doctors_available: int = 3,
) -> tuple[str, str]:
    """
    Automatically calculates clinical intake & triage mode:
    - Code Black ('critical'): 100% capacity (zero beds & zero ICU) OR 0 doctors on duty
    - Diverting ('diverting'): ICU exhausted (0) or ward beds <= 2 or only 1 doctor on duty
    - Surging ('surging'): 0 ambulances, or ICU occupancy >= 75%, or beds <= 5, or <= 2 doctors
    - Operational ('operational'): Healthy capacity across beds, ICU, doctors, and ambulances
    """
    total_beds = max(1, total_beds)
    icu_total = max(1, icu_total)

    # 1. Code Black (zero intake capacity)
    if (available_beds == 0 and icu_available == 0) or doctors_available == 0:
        if doctors_available == 0:
            return "critical", "Auto-Trigger: 0 emergency physicians on duty. Facility cannot admit casualties (Code Black)."
        return "critical", "Auto-Trigger: Zero ward beds and zero ICU beds available (100% full capacity). Code Black."

    # 2. Diverting (reroute minor cases)
    if icu_available == 0 or available_beds <= 2 or doctors_available <= 1:
        if doctors_available <= 1:
            return "diverting", "Auto-Trigger: Severe staffing shortage (only 1 physician on duty). Diverting non-critical admissions."
        return "diverting", f"Auto-Trigger: {'0 ICU beds' if icu_available == 0 else f'only {available_beds} ward beds'} remaining. Non-critical cases diverted."

    # 3. Surging (critical trauma only)
    icu_occ_pct = (1.0 - (icu_available / icu_total)) * 100.0
    if ambulances_available == 0 or icu_occ_pct >= 75.0 or available_beds <= 5 or doctors_available <= 2:
        reasons = []
        if ambulances_available == 0:
            reasons.append("0 ambulances on standby")
        if doctors_available <= 2:
            reasons.append(f"limited ER physician coverage ({doctors_available} on duty)")
        if icu_occ_pct >= 75.0:
            reasons.append(f"ICU occupancy high ({round(icu_occ_pct)}%)")
        if available_beds <= 5:
            reasons.append(f"only {available_beds} beds left")
        return "surging", f"Auto-Trigger: {', '.join(reasons)}. Reserved for critical trauma only."

    # 4. Operational (normal intake)
    return "operational", f"Auto-Trigger: Healthy capacity ({available_beds} beds, {icu_available} ICU, {doctors_available} doctors, {ambulances_available} ambulances ready)."

def update_hospital_telemetry(hospital_id: str, updates: dict) -> dict | None:
    hospitals = load_hospitals()
    for h in hospitals:
        if h["id"] == hospital_id:
            for k, v in updates.items():
                if v is not None and k != "auto_status":
                    h[k] = v
            if "ambulances_available" in updates and updates["ambulances_available"] is not None:
                h["ambulances_available"] = max(0, int(updates["ambulances_available"]))
                h["ambulance_ready"] = h["ambulances_available"] > 0
            if "available_beds" in updates and updates["available_beds"] is not None:
                h["available_beds"] = max(0, int(updates["available_beds"]))
            if "icu_available" in updates and updates["icu_available"] is not None:
                h["icu_available"] = max(0, int(updates["icu_available"]))
            if "doctors_available" in updates and updates["doctors_available"] is not None:
                h["doctors_available"] = max(0, int(updates["doctors_available"]))

            # Auto-compute status dynamically if auto_status is True or status was not explicitly passed
            if updates.get("auto_status") or "status" not in updates:
                docs = h.get("doctors_available")
                if docs is None:
                    docs = len(h.get("on_duty_doctors", [])) or 3
                auto_status, reason = compute_auto_facility_status(
                    available_beds=h.get("available_beds", 0),
                    total_beds=h.get("total_beds", 20),
                    icu_available=h.get("icu_available", 0),
                    icu_total=h.get("icu_total", 20),
                    ambulances_available=h.get("ambulances_available", 0),
                    doctors_available=docs,
                )
                h["status"] = auto_status
                h["auto_status_reason"] = reason
            elif "status" in updates and updates["status"]:
                h["status"] = updates["status"]
                h["auto_status_reason"] = f"Manual Override: Set to {updates['status']} by Hospital Command."

            return h
    return None

def reset_hospitals_cache():
    global _HOSPITALS_CACHE, _FIRE_STATIONS_CACHE, _POLICE_STATIONS_CACHE
    with open("data/mock_hospitals.json") as f:
        _HOSPITALS_CACHE = json.load(f)
    with open("data/mock_fire_stations.json") as f:
        _FIRE_STATIONS_CACHE = json.load(f)
    with open("data/mock_police_stations.json") as f:
        _POLICE_STATIONS_CACHE = json.load(f)
    return _HOSPITALS_CACHE

async def match_resources(incident: dict, incident_location: dict | None = None) -> dict:
    need_type = (incident.get("need_type") or "medical").lower()
    urgency = incident.get("urgency", "high")
    total_victims = incident.get("victim_count_estimate", 1)

    # 1. Fire Emergencies: Route to Fire & Rescue Stations
    if need_type in ("fire", "burns", "explosion"):
        stations = load_fire_stations()
        screened_facilities = []
        for s in stations:
            distance_km = 3.0
            if incident_location and incident_location.get("latitude"):
                distance_km = haversine_km(
                    incident_location["latitude"], incident_location["longitude"],
                    s["latitude"], s["longitude"]
                )
            engines = s.get("fire_engines_available", 0)
            status = "qualified" if engines > 0 else "disqualified"
            reason = (
                f"Verified: {engines} fire engine(s) ready, aerial ladder platform on standby"
                if engines > 0
                else "Disqualified: All fire engines currently deployed to other emergencies"
            )
            score = 85.0 - min(distance_km * 2.0, 30.0) if engines > 0 else 10.0

            screened_facilities.append({
                "hospital_id": s["id"],
                "name": s["name"],
                "area": s["area"],
                "distance_km": distance_km,
                "status": status,
                "score": round(score, 1),
                "reason": reason,
                "ambulances_available": 0,
                "fire_engines_available": engines,
                "water_capacity_liters": s.get("water_tender_capacity_liters", 10000),
                "icu_available": 0,
                "available_beds": 0,
                "equipment": s.get("equipment", []),
                "emergency_hotline": s.get("emergency_hotline", "101"),
            })

        screened_facilities.sort(key=lambda x: (0 if x["status"] == "qualified" else 1, -x["score"]))
        primary = screened_facilities[0]
        dist = primary.get("distance_km") or 2.5
        eta_minutes = max(3, round(2.5 + (dist * 1.4)))

        return {
            "distribution_plan": [{
                "hospital_id": primary["hospital_id"],
                "hospital_name": primary["name"],
                "area": primary["area"],
                "distance_km": primary["distance_km"],
                "victims_assigned": total_victims,
                "beds_available": 0,
                "fire_engines_available": primary.get("fire_engines_available", 2),
                "status": primary["status"],
                "reason": primary["reason"],
                "emergency_hotline": primary["emergency_hotline"],
            }],
            "screened_facilities": screened_facilities,
            "alerted_facilities": [primary],
            "selected_facility": {
                "hospital_id": primary["hospital_id"],
                "hospital_name": primary["name"],
                "area": primary["area"],
                "latitude": primary.get("latitude"),
                "longitude": primary.get("longitude"),
                "distance_km": primary["distance_km"],
                "eta_minutes": eta_minutes,
                "assigned_ambulance_id": f"FIRE-ENG-0{primary.get('fire_engines_available', 1)}",
                "emergency_hotline": primary["emergency_hotline"],
                "status": "alert_dispatched",
                "facility_type": "fire_station",
            },
            "required_equipment": ["fire_engine", "aerial_ladder", "water_tender_10000L", "scba_rescue_kits"],
            "reasoning": [f"Targeted {primary['name']} ({primary['distance_km']} km): {primary['reason']}"],
            "eta_minutes": eta_minutes,
        }

    # 2. Police & Traffic/Road Obstruction Emergencies: Route to Police & Traffic Precincts
    if need_type in ("police", "traffic", "road_block", "blockage", "protest", "crime"):
        stations = load_police_stations()
        screened_facilities = []
        for s in stations:
            distance_km = 2.8
            if incident_location and incident_location.get("latitude"):
                distance_km = haversine_km(
                    incident_location["latitude"], incident_location["longitude"],
                    s["latitude"], s["longitude"]
                )
            patrols = s.get("patrol_cars_available", 0)
            tows = s.get("tow_trucks_available", 0)
            ready = patrols + tows
            status = "qualified" if ready > 0 else "disqualified"
            reason = (
                f"Verified: {patrols} patrol cruisers & {tows} heavy tow truck(s) ready with traffic diversion kit"
                if ready > 0
                else "Disqualified: All patrol and traffic units currently dispatched"
            )
            score = 90.0 - min(distance_km * 2.0, 30.0) if ready > 0 else 10.0

            screened_facilities.append({
                "hospital_id": s["id"],
                "name": s["name"],
                "area": s["area"],
                "distance_km": distance_km,
                "status": status,
                "score": round(score, 1),
                "reason": reason,
                "ambulances_available": 0,
                "patrol_cars_available": patrols,
                "tow_trucks_available": tows,
                "icu_available": 0,
                "available_beds": 0,
                "equipment": s.get("equipment", []),
                "emergency_hotline": s.get("emergency_hotline", "100"),
            })

        screened_facilities.sort(key=lambda x: (0 if x["status"] == "qualified" else 1, -x["score"]))
        primary = screened_facilities[0]
        dist = primary.get("distance_km") or 2.5
        eta_minutes = max(3, round(2.0 + (dist * 1.3)))
        unit_id = f"POLICE-PATROL-0{primary.get('patrol_cars_available', 1)}" if primary.get("patrol_cars_available", 0) > 0 else "TRAFFIC-TOW-01"

        return {
            "distribution_plan": [{
                "hospital_id": primary["hospital_id"],
                "hospital_name": primary["name"],
                "area": primary["area"],
                "distance_km": primary["distance_km"],
                "victims_assigned": total_victims,
                "beds_available": 0,
                "patrol_cars_available": primary.get("patrol_cars_available", 2),
                "tow_trucks_available": primary.get("tow_trucks_available", 1),
                "status": primary["status"],
                "reason": primary["reason"],
                "emergency_hotline": primary["emergency_hotline"],
            }],
            "screened_facilities": screened_facilities,
            "alerted_facilities": [primary],
            "selected_facility": {
                "hospital_id": primary["hospital_id"],
                "hospital_name": primary["name"],
                "area": primary["area"],
                "latitude": primary.get("latitude"),
                "longitude": primary.get("longitude"),
                "distance_km": primary["distance_km"],
                "eta_minutes": eta_minutes,
                "assigned_ambulance_id": unit_id,
                "emergency_hotline": primary["emergency_hotline"],
                "status": "alert_dispatched",
                "facility_type": "police_station",
            },
            "required_equipment": ["patrol_interceptor", "heavy_tow_truck", "traffic_diversion_kits"],
            "reasoning": [f"Targeted {primary['name']} ({primary['distance_km']} km): {primary['reason']}"],
            "eta_minutes": eta_minutes,
        }

    # 3. Medical & Trauma Emergencies: Route to Hospitals
    hospitals = load_hospitals()
    required_equipment = derive_required_equipment(need_type, urgency)

    screened_facilities = []
    for h in hospitals:
        distance_km = None
        if incident_location and incident_location.get("latitude"):
            distance_km = haversine_km(
                incident_location["latitude"], incident_location["longitude"],
                h["latitude"], h["longitude"]
            )
        evaluation = evaluate_hospital_readiness(h, need_type, urgency, distance_km)
        screened_facilities.append(evaluation)

    screened_facilities.sort(
        key=lambda x: (
            0 if x["status"] == "qualified" else (1 if x["status"] == "mutual_aid" else 2),
            -x["score"]
        )
    )

    qualified_facilities = [f for f in screened_facilities if f["status"] == "qualified"]
    alert_targets = qualified_facilities[:2] if qualified_facilities else screened_facilities[:1]
    primary_target = alert_targets[0] if alert_targets else screened_facilities[0]

    dist = primary_target.get("distance_km") or 3.2
    eta_minutes = max(4, round(3.0 + (dist * 1.6)))

    total_capacity = sum(h["available_beds"] for h in hospitals if h["id"] in [t["hospital_id"] for t in alert_targets]) or 1
    distribution_plan = []
    remaining = total_victims

    for i, target in enumerate(alert_targets):
        h_record = next((h for h in hospitals if h["id"] == target["hospital_id"]), None)
        if not h_record:
            continue
        
        assigned = remaining if i == len(alert_targets) - 1 else min(
            round(total_victims * (h_record["available_beds"] / total_capacity)),
            h_record["available_beds"],
            remaining
        )
        assigned = max(0, assigned)
        remaining -= assigned

        distribution_plan.append({
            "hospital_id": target["hospital_id"],
            "hospital_name": target["name"],
            "area": target["area"],
            "distance_km": target["distance_km"],
            "victims_assigned": assigned,
            "beds_available": h_record["available_beds"],
            "ambulances_available": h_record.get("ambulances_available", 0),
            "status": target["status"],
            "reason": target["reason"],
            "emergency_hotline": target["emergency_hotline"],
        })

    reasoning = [
        f"Targeted {primary_target['name']} ({primary_target['distance_km']} km): {primary_target['reason']}",
    ]
    for other in screened_facilities[1:3]:
        reasoning.append(f"{other['name']} ({other['distance_km']} km): {other['reason']}")

    ambulance_unit_id = f"AMB-{primary_target['hospital_id'][-2:].upper()}104"

    return {
        "distribution_plan": distribution_plan,
        "screened_facilities": screened_facilities,
        "alerted_facilities": alert_targets,
        "selected_facility": {
            "hospital_id": primary_target["hospital_id"],
            "hospital_name": primary_target["name"],
            "area": primary_target["area"],
            "latitude": primary_target.get("latitude"),
            "longitude": primary_target.get("longitude"),
            "distance_km": primary_target["distance_km"],
            "eta_minutes": eta_minutes,
            "ambulances_available": primary_target["ambulances_available"],
            "assigned_ambulance_id": ambulance_unit_id,
            "emergency_hotline": primary_target["emergency_hotline"],
            "status": "alert_dispatched",
            "facility_type": "hospital",
        },
        "required_equipment": required_equipment,
        "reasoning": reasoning,
        "eta_minutes": eta_minutes,
    }