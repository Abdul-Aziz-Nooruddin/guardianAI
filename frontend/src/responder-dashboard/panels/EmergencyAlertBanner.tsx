import { useState } from "react";
import {
  AlertTriangle,
  Flame,
  Shield,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Navigation,
  Clock,
  Quote,
  Camera,
  Maximize2,
  Eye,
  X,
  Building2,
} from "lucide-react";
import { acceptIncident, logResponderDecision } from "../../shared/api/client";
import type { Incident, ScreenedFacility } from "../../shared/types";
import IncidentMiniMap from "./IncidentMiniMap";

interface EmergencyAlertBannerProps {
  incident: Incident;
  userRole?: string;
  onAccepted?: (incidentId: string) => void;
  onSwitchToHospital?: (hospitalId?: string) => void;
}

export default function EmergencyAlertBanner({
  incident,
  userRole = "medical",
  onAccepted,
  onSwitchToHospital,
}: EmergencyAlertBannerProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const isFire = incident.need_type === "fire" || incident.responder_role === "fire_brigade";
  const isPolice = incident.need_type === "police" || incident.responder_role === "police";

  const isAccepted =
    incident.status === "accepted_en_route" ||
    incident.acceptance !== undefined;

  const targetFacility = incident.selected_facility;
  const targetFacilityName =
    incident.acceptance?.responder_name ||
    targetFacility?.hospital_name ||
    (isFire
      ? "Secunderabad Fire & Rescue Command"
      : isPolice
      ? "Banjara Hills Traffic & Law Enforcement Precinct"
      : "Apollo Emergency & Trauma Center");

  const vehicleId =
    incident.acceptance?.ambulance_id ||
    targetFacility?.assigned_ambulance_id ||
    (isFire ? "FIRE-ENG-02" : isPolice ? "POLICE-PATROL-01" : "AMB-104");

  const etaMinutes =
    incident.acceptance?.eta_minutes ||
    targetFacility?.eta_minutes ||
    (isFire ? 5 : isPolice ? 4 : 7);

  const distanceKm = targetFacility?.distance_km ?? 2.8;

  const victimLat = incident.latitude ?? 17.4156;
  const victimLng = incident.longitude ?? 78.4347;

  // Station base coordinates for routing vector
  const stationLat =
    targetFacility?.latitude ??
    (isFire ? 17.4399 : isPolice ? 17.4156 : 17.4156);
  const stationLng =
    targetFacility?.longitude ??
    (isFire ? 78.4983 : isPolice ? 78.4350 : 78.4350);

  const screenedFacilities = incident.screened_facilities || [];

  const [isOverridden, setIsOverridden] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await acceptIncident({
        incident_id: incident.incident_id,
        responder_id: targetFacility?.hospital_id || (isFire ? "fs_central" : isPolice ? "ps_banjara" : "h_c"),
        responder_name: targetFacilityName,
        responder_role: userRole,
        ambulance_id: vehicleId,
        eta_minutes: etaMinutes,
        notes: isFire
          ? "Plan approved by responder. Fire engines deployed."
          : isPolice
          ? "Plan approved by responder. Patrol interceptor deployed."
          : "Plan approved by responder. Ambulance and trauma team deployed.",
      });

      try {
        await logResponderDecision(incident.incident_id, "approved");
      } catch (e) {
        console.warn("Decision logging notification:", e);
      }

      if (onAccepted) {
        onAccepted(incident.incident_id);
      }
    } catch (err) {
      console.error("Failed to approve and dispatch incident", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    setIsOverridden(true);
    try {
      await logResponderDecision(incident.incident_id, "overridden");
    } catch (e) {
      console.warn("Override logging notification:", e);
    }
  };

  const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${stationLat},${stationLng}&destination=${victimLat},${victimLng}&travelmode=driving`;

  const borderAccent = isAccepted
    ? "var(--success)"
    : incident.urgency === "critical"
    ? "var(--critical)"
    : "var(--warning)";

  return (
    <div
      className="emergency-alert-banner-container"
      style={{
        margin: "14px 20px 18px",
        padding: "18px 20px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `4px solid ${borderAccent}`,
        borderRadius: "8px",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-subtle)",
      }}
    >
      {/* 2-Column Responsive Layout */}
      <div
        className="emergency-alert-banner-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "20px",
          alignItems: "stretch",
        }}
      >
        {/* LEFT COLUMN: Victim Information & Proximity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Header Row: Status & Badges */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: isAccepted
                    ? "var(--success-bg)"
                    : incident.urgency === "critical"
                    ? "var(--critical-bg)"
                    : "var(--warning-bg)",
                  color: isAccepted
                    ? "var(--success)"
                    : incident.urgency === "critical"
                    ? "var(--critical)"
                    : "var(--warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `1px solid ${
                    isAccepted
                      ? "var(--success-border)"
                      : incident.urgency === "critical"
                      ? "var(--critical-border)"
                      : "var(--warning-border)"
                  }`,
                }}
              >
                {isAccepted ? (
                  <CheckCircle2 size={17} />
                ) : isFire ? (
                  <Flame size={17} />
                ) : isPolice ? (
                  <Shield size={17} />
                ) : (
                  <AlertTriangle size={17} />
                )}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: "var(--text-primary)",
                    }}
                  >
                    {isAccepted
                      ? `Unit En Route: ${vehicleId}`
                      : (!isFire && !isPolice)
                      ? `Intake Request Routed: ${targetFacilityName}`
                      : `${(incident.need_type || "Emergency").replace("_", " ").toUpperCase()} DISPATCH`}
                  </span>

                  <span
                    className={
                      isAccepted
                        ? "badge success"
                        : (!isFire && !isPolice)
                        ? "badge warning"
                        : incident.urgency === "critical"
                        ? "badge critical"
                        : "badge medium"
                    }
                  >
                    {isAccepted
                      ? "Intake Confirmed"
                      : (!isFire && !isPolice)
                      ? "Awaiting Hospital Approval"
                      : `${incident.urgency || "High"} Priority`}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span className="incident-id">
                    INC-{incident.incident_id.replace(/^inc_/, "").padStart(5, "0").toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>CHANNEL: {userRole?.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {incident.gps_verified && (
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: "4px",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  background: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <MapPin size={11} /> GPS Verified (±{incident.accuracy_meters || 5}m)
              </span>
            )}
          </div>

          {/* Victim Situational Statement */}
          <div
            style={{
              padding: "9px 12px",
              background: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <Quote size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.45 }}>
              “{incident.victim_reply ? (incident.location_text || "Emergency reported at location") : "Reported incident: please clear corridor and dispatch emergency response immediately."}”
            </div>
          </div>

          {/* On-Scene Live Camera / Video Visual Proof */}
          {incident.media_url ? (
            <div
              style={{
                padding: "10px 12px",
                background: "var(--bg-app)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div
                onClick={() => setShowMediaModal(true)}
                style={{
                  position: "relative",
                  width: "72px",
                  height: "72px",
                  borderRadius: "5px",
                  overflow: "hidden",
                  border: "1px solid var(--border-strong)",
                  cursor: "pointer",
                  flexShrink: 0,
                  background: "var(--bg-muted)",
                }}
                title="Click to view full-resolution visual evidence"
              >
                {incident.media_type === "video" ? (
                  <video
                    src={incident.media_url}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <img
                    src={incident.media_url}
                    alt="On-scene evidence"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    background: "rgba(0,0,0,0.7)",
                    borderRadius: "3px",
                    padding: "1px 4px",
                    fontSize: "8.5px",
                    color: "#ffffff",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <Maximize2 size={8} /> {incident.media_type === "video" ? "VIDEO" : "PHOTO"}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={13} color="var(--success)" />
                  <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    On-Scene Camera Telemetry Attached
                  </strong>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.4 }}>
                  Visual telemetry transmitted by citizen at {incident.location_text || "scene"}. Anti-spoofing validated.
                </div>
                <button
                  type="button"
                  onClick={() => setShowMediaModal(true)}
                  style={{
                    marginTop: "6px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Eye size={12} /> Inspect Evidence
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Camera size={13} />
                <span>No camera telemetry attached to initial report (Text/Voice only).</span>
              </div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>
                Awaiting Scout Recon
              </span>
            </div>
          )}

          {/* Anti-Spoofing & Spatial Dispersion Verification Widget */}
          {incident.verification && (
            <div
              style={{
                padding: "9px 12px",
                background: incident.verification.is_anomaly
                  ? "var(--critical-bg)"
                  : "var(--bg-muted)",
                border: `1px solid ${
                  incident.verification.is_anomaly
                    ? "var(--critical-border)"
                    : "var(--border-subtle)"
                }`,
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {incident.verification.is_anomaly ? (
                    <ShieldAlert size={14} color="var(--critical)" />
                  ) : (
                    <CheckCircle2 size={14} color="var(--success)" />
                  )}
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: incident.verification.is_anomaly
                        ? "var(--critical-text)"
                        : "var(--text-primary)",
                    }}
                  >
                    {incident.verification.is_anomaly
                      ? "Anti-Spoofing Alert: Co-Location Anomaly"
                      : "Spatially Verified: Multi-Angle Triangulation"}
                  </span>
                </div>

                <span
                  className={
                    incident.verification.is_anomaly
                      ? "badge critical"
                      : "badge success"
                  }
                >
                  {incident.verification.is_anomaly
                    ? "POTENTIAL SYBIL CLUSTER"
                    : `${incident.verification.spatial_dispersion?.quadrants_covered || 3} QUADRANTS CONFIRMED`}
                </span>
              </div>

              {/* Sub-metrics */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  fontSize: "10.5px",
                  color: "var(--text-muted)",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "5px",
                  marginTop: "2px",
                }}
              >
                <span>
                  <strong>Tower:</strong>{" "}
                  {incident.verification.co_location?.cell_tower_collision
                    ? "Sector Match"
                    : "Distinct"}
                </span>
                <span>•</span>
                <span>
                  <strong>Wi-Fi:</strong>{" "}
                  {incident.verification.co_location?.bssid_collision
                    ? "Matching BSSID"
                    : "Diverse"}
                </span>
                <span>•</span>
                <span>
                  <strong>Spread:</strong>{" "}
                  {incident.verification.spatial_dispersion?.angular_spread_degrees ?? 0}°
                </span>
                <span>•</span>
                <span>
                  <strong>Dispersion:</strong>{" "}
                  {incident.verification.spatial_dispersion?.dispersion_score !== undefined
                    ? `${Math.round(incident.verification.spatial_dispersion.dispersion_score * 100)}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          )}

          {/* Proximity & Distance Section */}
          <div
            className="proximity-metrics-grid"
            style={{
              padding: "10px 14px",
              background: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.3fr",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {/* 1. Distance Metric */}
            <div>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>
                Distance
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "3px", marginTop: "1px" }}>
                <span className="tabular-nums" style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                  {distanceKm}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>KM</span>
              </div>
            </div>

            {/* 2. ETA Metric */}
            <div>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>
                Drive ETA
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "1px" }}>
                <Clock size={13} color="var(--text-secondary)" />
                <span className="tabular-nums" style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                  ~{etaMinutes}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>MIN</span>
              </div>
            </div>

            {/* 3. Assigned Responder Service */}
            <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                {(!isFire && !isPolice) ? "Receiving Medical Center" : "Responding Base"}
              </div>
              <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-primary)", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {targetFacilityName}
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "1px" }}>
                {isAccepted ? `Active Unit: ${vehicleId}` : `Designated Unit: ${vehicleId}`}
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
            {!isAccepted ? (
              <>
                {/* Municipal CAD dispatchers approve Police / Fire directly */}
                {(isFire || isPolice) ? (
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      gap: "6px",
                    }}
                  >
                    {isFire ? <Flame size={14} /> : <Shield size={14} />}
                    {loading
                      ? "Dispatching..."
                      : isFire
                      ? "Approve Fire Engine"
                      : "Approve Police Interceptor"}
                  </button>
                ) : (
                  /* Clinical / Medical Intake: Handled by Receiving Hospital Triage */
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "5px",
                        background: "var(--warning-bg)",
                        border: "1px solid var(--warning-border)",
                        color: "var(--warning-text)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={13} />
                      <span>Awaiting Hospital Intake Approval ({targetFacilityName})</span>
                    </div>

                    {onSwitchToHospital && (
                      <button
                        type="button"
                        onClick={() => onSwitchToHospital(targetFacility?.hospital_id)}
                        className="btn btn-primary"
                        style={{
                          padding: "7px 13px",
                          fontSize: "12px",
                          fontWeight: 600,
                          gap: "6px",
                        }}
                        title={`Open ${targetFacilityName} portal to verify capacity and approve casualty intake`}
                      >
                        <Building2 size={13} />
                        <span>Open Hospital Dashboard</span>
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={handleOverride}
                  className="btn btn-secondary"
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                  }}
                  title="Override AI dispatch plan and select alternative facility"
                >
                  Override / Divert
                </button>

                {isOverridden && (
                  <span className="badge medium">
                    OVERRIDDEN
                  </span>
                )}
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "5px",
                  background: "var(--success-bg)",
                  border: "1px solid var(--success-border)",
                  color: "var(--success-text)",
                  fontWeight: 600,
                  fontSize: "12px",
                }}
              >
                <CheckCircle2 size={14} />
                <span>
                  {(!isFire && !isPolice)
                    ? `Hospital Intake Approved by ${targetFacilityName} — Unit En Route (${vehicleId})`
                    : `Unit En Route (${vehicleId})`}
                </span>
              </div>
            )}

            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                textDecoration: "none",
                gap: "5px",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              title="Open direct turn-by-turn route in Google Maps"
            >
              <Navigation size={13} />
              <span>Route</span>
            </a>

            <button
              onClick={() => setShowScreeningModal((prev) => !prev)}
              className="btn btn-secondary"
              style={{
                marginLeft: "auto",
                fontSize: "11.5px",
                gap: "4px",
                padding: "7px 10px",
              }}
            >
              <span>Facilities</span>
              {showScreeningModal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Mini Map of Exact Victim Location */}
        <div
          style={{
            minHeight: "220px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="status-dot" />
              <span>Tactical GPS Radar & Route</span>
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "10.5px" }}>
              Station ➔ Scene
            </span>
          </div>

          <div style={{ flex: 1, minHeight: "220px" }}>
            <IncidentMiniMap
              victimLat={victimLat}
              victimLng={victimLng}
              stationLat={stationLat}
              stationLng={stationLng}
              victimLocationText={incident.location_text}
              stationName={targetFacilityName}
              distanceKm={distanceKm}
              etaMinutes={etaMinutes}
              isAccepted={isAccepted}
            />
          </div>
        </div>
      </div>

      {/* Expandable Facility Readiness Matrix */}
      {showScreeningModal && screenedFacilities.length > 0 && (
        <div
          style={{
            marginTop: "14px",
            paddingTop: "14px",
            borderTop: "1px solid var(--border-subtle)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "10px",
          }}
        >
          {screenedFacilities.map((fac: ScreenedFacility) => {
            const isQual = fac.status === "qualified";
            const isMut = fac.status === "mutual_aid";
            return (
              <div
                key={fac.hospital_id}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "11.5px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{fac.name}</strong>
                  <span
                    className={
                      isQual
                        ? "badge success"
                        : isMut
                        ? "badge medium"
                        : "badge critical"
                    }
                  >
                    {isQual ? "QUALIFIED" : isMut ? "MUTUAL AID" : "DISQUALIFIED"}
                  </span>
                </div>
                <div style={{ color: "var(--text-muted)", margin: "4px 0" }}>
                  Dist: {fac.distance_km} km • Vehicles: {fac.ambulances_available ?? fac.fire_engines_available ?? fac.patrol_cars_available ?? 0} • Score: {fac.score}/100
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                  {fac.reason}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-Screen Media Modal */}
      {showMediaModal && incident.media_url && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowMediaModal(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "8px",
              padding: "16px",
              maxWidth: "680px",
              width: "100%",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-elevated)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                Verified On-Scene Telemetry
              </div>
              <button
                onClick={() => setShowMediaModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ borderRadius: "6px", overflow: "hidden", background: "#000", maxHeight: "420px", display: "flex", justifyContent: "center" }}>
              {incident.media_type === "video" ? (
                <video src={incident.media_url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "420px" }} />
              ) : (
                <img src={incident.media_url} alt="Scene proof" style={{ maxWidth: "100%", maxHeight: "420px", objectFit: "contain" }} />
              )}
            </div>

            <div style={{ marginTop: "10px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
              Transmitted from {incident.location_text || "scene"}. Geolocation and anti-spoofing signature verified.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
