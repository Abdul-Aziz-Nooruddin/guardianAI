import math
import datetime
from typing import Optional, List, Dict, Any

# In-memory store of individual reports per incident_id
# Structure: { incident_id: [ { user_id, reporter_lat, reporter_lng, cell_tower_id, bssid, timestamp }, ... ] }
INCIDENT_TELEMETRY_STORE: Dict[str, List[Dict[str, Any]]] = {}

def clear_telemetry_cache():
    """Wipe telemetry store (used on admin reset)."""
    INCIDENT_TELEMETRY_STORE.clear()

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in meters."""
    r = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c

def calculate_bearing_degrees(origin_lat: float, origin_lon: float, target_lat: float, target_lon: float) -> float:
    """
    Computes forward azimuth / bearing from the incident origin to the witness location in degrees [0, 360).
    Represents the viewing angle / vantage point from which the witness observes the incident center.
    """
    phi1, phi2 = math.radians(origin_lat), math.radians(target_lat)
    dlambda = math.radians(target_lon - origin_lon)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0

def get_quadrant(bearing_deg: float) -> int:
    """
    Categorizes bearing into 4 geographic compass quadrants:
    1: 0°-90° (North-East)
    2: 90°-180° (South-East)
    3: 180°-270° (South-West)
    4: 270°-360° (North-West)
    """
    if 0 <= bearing_deg < 90:
        return 1
    elif 90 <= bearing_deg < 180:
        return 2
    elif 180 <= bearing_deg < 270:
        return 3
    else:
        return 4

def get_quadrant_name(q: int) -> str:
    names = {1: "NE (0°-90°)", 2: "SE (90°-180°)", 3: "SW (180°-270°)", 4: "NW (270°-360°)"}
    return names.get(q, "Unknown")

def circular_standard_deviation(bearings: List[float]) -> float:
    """
    Calculates circular standard deviation for an array of directional angles in degrees.
    Returns 0.0 if all angles are identical (collinear), up to ~110° for widely dispersed angles.
    """
    if len(bearings) < 2:
        return 0.0
    c_sum = sum(math.cos(math.radians(b)) for b in bearings) / len(bearings)
    s_sum = sum(math.sin(math.radians(b)) for b in bearings) / len(bearings)
    r = math.sqrt(c_sum**2 + s_sum**2)
    if r >= 0.999999:
        return 0.0
    if r <= 0.0001:
        return 115.0  # Uniformly distributed in all directions
    return math.degrees(math.sqrt(-2.0 * math.log(r)))

def detect_co_location_anomaly(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Checks for Physical Co-Location Anomaly:
    1. Identical Cell Tower IDs across supposedly distinct users
    2. Identical Wi-Fi BSSID footprint
    3. Mutual micro-distance (devices sitting within <= 15m of each other, e.g. same desk or room)
    """
    n = len(reports)
    if n < 2:
        return {
            "anomaly_detected": False,
            "cell_tower_collision": False,
            "bssid_collision": False,
            "micro_distance_collision": False,
            "min_inter_device_distance_meters": 999.0,
            "matching_cell_towers": [],
            "matching_bssids": [],
            "reason": "Single report baseline",
        }

    # 1. Cell Tower & BSSID matches
    cell_towers = [r.get("cell_tower_id") for r in reports if r.get("cell_tower_id")]
    bssids = [r.get("bssid") for r in reports if r.get("bssid")]

    cell_tower_collision = False
    matching_towers = []
    if len(cell_towers) >= 2:
        # Check if all reports share the same cell tower
        unique_towers = set(cell_towers)
        if len(unique_towers) == 1:
            cell_tower_collision = True
            matching_towers = list(unique_towers)

    bssid_collision = False
    matching_bssids = []
    if len(bssids) >= 2:
        # Check if all reports share the same Wi-Fi BSSID
        unique_bssids = set(bssids)
        if len(unique_bssids) == 1:
            bssid_collision = True
            matching_bssids = list(unique_bssids)

    # 2. Pairwise physical device distance
    min_dist = 999999.0
    for i in range(n):
        for j in range(i + 1, n):
            lat1, lon1 = reports[i].get("reporter_lat"), reports[i].get("reporter_lng")
            lat2, lon2 = reports[j].get("reporter_lat"), reports[j].get("reporter_lng")
            if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
                d = haversine_distance_meters(lat1, lon1, lat2, lon2)
                if d < min_dist:
                    min_dist = d

    # If devices are within <= 18 meters of each other (same desk/room)
    micro_distance_collision = min_dist <= 18.0

    # Strong anomaly if BSSID matches OR (Cell Tower matches and micro-distance <= 25m) OR micro-distance <= 12m
    anomaly = bssid_collision or (cell_tower_collision and micro_distance_collision) or micro_distance_collision

    reasons = []
    if bssid_collision:
        reasons.append(f"100% reports share identical Wi-Fi BSSID [{matching_bssids[0]}]")
    if cell_tower_collision:
        reasons.append(f"Reports share identical Cellular Base Station Tower [{matching_towers[0]}]")
    if micro_distance_collision:
        reasons.append(f"Devices physically co-located within {min_dist:.1f}m (same desk/room footprint)")

    return {
        "anomaly_detected": anomaly,
        "cell_tower_collision": cell_tower_collision,
        "bssid_collision": bssid_collision,
        "micro_distance_collision": micro_distance_collision,
        "min_inter_device_distance_meters": round(min_dist, 1) if min_dist < 999999.0 else None,
        "matching_cell_towers": matching_towers,
        "matching_bssids": matching_bssids,
        "reason": " & ".join(reasons) if reasons else "No co-location anomaly detected",
    }

def analyze_spatial_dispersion(
    incident_lat: float,
    incident_lng: float,
    reports: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Analyzes Spatial Dispersion and Viewing Angle Physics:
    - Line-of-sight distance from each reporter to the incident center
    - Forward azimuth / viewing bearing (theta) of each witness
    - Angular spread (circular standard deviation)
    - Compass quadrant coverage (1-4)
    - Normalized Dispersion Score [0.0, 1.0]
    """
    n = len(reports)
    if n < 2:
        return {
            "dispersion_score": 0.50,
            "angular_spread_degrees": 0.0,
            "quadrants_covered": 1,
            "quadrant_names": ["Single Source"],
            "all_within_los": True,
            "status": "single_reporter",
            "description": "Baseline: Single source report awaiting additional observer corroboration.",
            "bearings": [],
            "distances_meters": [],
        }

    bearings = []
    distances = []
    quadrants = set()
    los_violations = 0

    for r in reports:
        rep_lat = r.get("reporter_lat", incident_lat)
        rep_lng = r.get("reporter_lng", incident_lng)

        d = haversine_distance_meters(incident_lat, incident_lng, rep_lat, rep_lng)
        distances.append(round(d, 1))

        # Real witnesses are typically within 25m to 2500m of an emergency scene
        if d > 3500.0:
            los_violations += 1

        # If reporter is at the exact center (< 5m), assign neutral angle
        if d < 5.0:
            b = 0.0
        else:
            b = calculate_bearing_degrees(incident_lat, incident_lng, rep_lat, rep_lng)
            quadrants.add(get_quadrant(b))
        bearings.append(round(b, 1))

    # Angular spread using circular standard deviation
    spread = circular_standard_deviation(bearings)
    quadrant_count = max(len(quadrants), 1)
    quadrant_names = [get_quadrant_name(q) for q in sorted(list(quadrants))] if quadrants else ["Co-located Point"]

    # Compute Dispersion Score S in [0.0, 1.0]
    # S = 0.4 * (spread / 90.0) + 0.4 * (quadrant_count / 3.0) + 0.2 * (LOS compliance)
    norm_spread = min(spread / 90.0, 1.0)
    norm_quadrants = min(quadrant_count / 3.0, 1.0)
    norm_los = 1.0 if los_violations == 0 else max(0.0, 1.0 - (los_violations / n))

    dispersion_score = round(0.45 * norm_spread + 0.35 * norm_quadrants + 0.20 * norm_los, 2)

    # Classify status
    if spread < 12.0 or quadrant_count == 1:
        status = "suspicious_collinear"
        description = f"Low angular spread ({spread:.1f}°). Reports clustered along identical vantage line without multi-angle triangulation."
    elif dispersion_score >= 0.65 and quadrant_count >= 2:
        status = "verified_multi_angle"
        description = f"High spatial dispersion ({spread:.1f}° spread across {quadrant_count} quadrants). Confirmed multi-vantage corroboration."
    else:
        status = "moderate_dispersion"
        description = f"Moderate dispersion ({spread:.1f}° spread, {quadrant_count} quadrant(s)). Partially corroborated."

    return {
        "dispersion_score": dispersion_score,
        "angular_spread_degrees": round(spread, 1),
        "quadrants_covered": quadrant_count,
        "quadrant_names": quadrant_names,
        "all_within_los": los_violations == 0,
        "status": status,
        "description": description,
        "bearings": bearings,
        "distances_meters": distances,
    }

def record_and_verify_telemetry(
    incident_id: str,
    incident_lat: float,
    incident_lng: float,
    report_telemetry: Dict[str, Any],
    base_confidence: float = 0.60,
    cluster_size: int = 1,
) -> Dict[str, Any]:
    """
    Main evaluation pipeline:
    1. Records the incoming telemetry for the incident_id.
    2. Runs Co-Location Anomaly Detection (Cell Towers, Wi-Fi BSSID, Micro-distance).
    3. Runs Spatial Dispersion & Viewing Angle Physics.
    4. Computes confidence adjustments and penalty logic.
    """
    # Initialize store for incident if missing
    if incident_id not in INCIDENT_TELEMETRY_STORE:
        INCIDENT_TELEMETRY_STORE[incident_id] = []

    # Clean & normalize report telemetry
    telemetry_entry = {
        "user_id": report_telemetry.get("user_id", "unknown"),
        "reporter_lat": report_telemetry.get("reporter_lat", incident_lat),
        "reporter_lng": report_telemetry.get("reporter_lng", incident_lng),
        "cell_tower_id": report_telemetry.get("cell_tower_id"),
        "bssid": report_telemetry.get("bssid"),
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

    # Append to incident history
    INCIDENT_TELEMETRY_STORE[incident_id].append(telemetry_entry)
    reports = INCIDENT_TELEMETRY_STORE[incident_id]
    total_reports = len(reports)

    # 1. Physical Co-Location Anomaly Detection
    coloc_result = detect_co_location_anomaly(reports)

    # 2. Spatial Dispersion & Viewing Angle Physics
    spatial_result = analyze_spatial_dispersion(incident_lat, incident_lng, reports)

    # 3. Confidence Adjustment & Sybil Detection
    is_anomaly = False
    verification_status = "unverified"
    final_confidence = base_confidence
    penalty_reason = None

    if total_reports == 1:
        final_confidence = 0.60
        verification_status = "unverified"
    else:
        # Multi-report evaluation
        if coloc_result["anomaly_detected"]:
            is_anomaly = True
            verification_status = "suspicious"
            # Cap confidence heavily — device farm detected!
            final_confidence = 0.38
            penalty_reason = f"Sybil Penalty: Physical co-location detected ({coloc_result['reason']}). Cluster confidence capped."
        elif spatial_result["status"] == "suspicious_collinear":
            is_anomaly = True
            verification_status = "suspicious"
            final_confidence = min(base_confidence, 0.48)
            penalty_reason = "Spatial Anomaly: Zero angular dispersion (< 12° spread). Single vantage point indicates spoofed cluster."
        elif spatial_result["status"] == "verified_multi_angle":
            verification_status = "verified"
            # Reward legitimate multi-angle triangulation!
            final_confidence = min(0.75 + (spatial_result["dispersion_score"] * 0.22), 0.98)
            penalty_reason = "Corroboration Bonus: Confirmed multi-angle physical triangulation."
        else:
            verification_status = "moderate"
            final_confidence = min(base_confidence, 0.72)

    return {
        "is_anomaly": is_anomaly,
        "verification_status": verification_status,
        "total_reports_analyzed": total_reports,
        "effective_cluster_size": 1 if is_anomaly else total_reports,
        "co_location": coloc_result,
        "spatial_dispersion": spatial_result,
        "confidence_evaluation": {
            "raw_confidence": base_confidence,
            "final_confidence": round(final_confidence, 2),
            "penalty_applied": is_anomaly,
            "reason": penalty_reason,
        },
    }
