import math

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return round(R * 2 * math.asin(math.sqrt(a)), 2)

def derive_required_equipment(need_type: str, urgency: str) -> list[str]:
    """Derives required life-saving equipment based on incident need and urgency."""
    need = (need_type or "medical").lower()
    if need in ("medical", "accident", "road_accident", "trauma", "crash"):
        if urgency in ("critical", "high"):
            return ["trauma_unit", "emergency_surgery", "icu_ventilator", "ct_scan"]
        return ["general_icu", "emergency_surgery", "oxygen_bank"]
    elif need in ("fire", "burns"):
        return ["trauma_unit", "burn_unit", "oxygen_bank", "icu_ventilator"]
    return ["general_icu", "oxygen_bank"]

def evaluate_hospital_readiness(
    hospital: dict,
    need_type: str,
    urgency: str,
    distance_km: float | None = None
) -> dict:
    """
    Evaluates a hospital against clinical and transport requirements.
    Classifies into:
      - 'qualified': Meets both ambulance and required medical equipment.
      - 'mutual_aid': Has equipment & beds, but lacks stationed ambulances.
      - 'disqualified': Lacks mandatory clinical equipment for this emergency.
    """
    required_equipment = derive_required_equipment(need_type, urgency)
    hospital_equipment = hospital.get("equipment", [])
    
    # Check equipment overlap
    matched_equipment = [eq for eq in required_equipment if eq in hospital_equipment]
    missing_equipment = [eq for eq in required_equipment if eq not in hospital_equipment]
    equip_match_ratio = len(matched_equipment) / len(required_equipment) if required_equipment else 1.0

    # Transport readiness
    ambulances_available = hospital.get("ambulances_available", 0)
    has_ambulance = ambulances_available > 0

    # Bed and doctor readiness
    icu_available = hospital.get("icu_available", 0)
    beds_available = hospital.get("available_beds", 0)
    doctors_available = hospital.get("doctors_available")
    if doctors_available is None:
        doctors_available = len(hospital.get("on_duty_doctors", []))

    # Classification logic
    status = "qualified"
    reason = "All readiness criteria met"

    if equip_match_ratio < 0.5:
        status = "disqualified"
        missing_fmt = ", ".join(m.replace("_", " ") for m in missing_equipment[:2])
        reason = f"Disqualified: Missing mandatory clinical gear ({missing_fmt})"
    elif doctors_available == 0:
        status = "disqualified"
        reason = "Disqualified: 0 emergency physicians on duty. Zero intake capacity."
    elif icu_available == 0 and beds_available == 0:
        status = "disqualified"
        reason = "Disqualified: 100% capacity reached. Zero ICU or trauma beds available."
    elif not has_ambulance:
        status = "mutual_aid"
        reason = "Partial Match: Clinical team ready, but 0 ambulances stationed. Requires external city fleet."
    else:
        status = "qualified"
        reason = f"Verified: {ambulances_available} ambulance(s) on standby, {doctors_available} doctors on duty, trauma equipment operational."

    # Scoring (0 - 100)
    dist_penalty = min(distance_km or 3.0, 20.0) * 2.0  # max 40 penalty
    base_score = (
        (equip_match_ratio * 40.0)
        + (20.0 if has_ambulance else 5.0)
        + min(icu_available * 2.0, 15.0)
        + min(doctors_available * 2.5, 10.0)
    )
    final_score = max(5.0, round(base_score - dist_penalty, 1))

    return {
        "hospital_id": hospital["id"],
        "name": hospital["name"],
        "area": hospital.get("area", "Hyderabad"),
        "latitude": hospital.get("latitude"),
        "longitude": hospital.get("longitude"),
        "distance_km": distance_km or 2.5,
        "status": status,
        "score": final_score,
        "reason": reason,
        "ambulances_available": ambulances_available,
        "icu_available": icu_available,
        "available_beds": beds_available,
        "doctors_available": doctors_available,
        "equipment": hospital_equipment,
        "matched_equipment": matched_equipment,
        "missing_equipment": missing_equipment,
        "on_duty_doctors": hospital.get("on_duty_doctors", []),
        "emergency_hotline": hospital.get("emergency_hotline", "112"),
    }
