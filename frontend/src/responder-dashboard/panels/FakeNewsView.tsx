import { useState } from "react";
import {
  AlertOctagon,
  ShieldAlert,
  Radio,
  Wifi,
  Compass,
  CheckCircle2,
  Play,
  RotateCcw,
} from "lucide-react";
import axios from "axios";
import type { Incident } from "../../shared/types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

interface Rumor {
  id: number;
  text: string;
  confidence: number;
  source: string;
  status: "pending" | "warned";
}

const INITIAL_RUMORS: Rumor[] = [
  {
    id: 1,
    text: '"Dam has burst near Osman Sagar" — circulating on WhatsApp',
    confidence: 96,
    source: "WhatsApp Forward",
    status: "pending",
  },
  {
    id: 2,
    text: '"All relief camps in Ameerpet are full, do not go" — unverified post',
    confidence: 82,
    source: "Twitter/X",
    status: "pending",
  },
  {
    id: 3,
    text: '"Free ambulance number changed to XXXX" — unofficial forward',
    confidence: 74,
    source: "WhatsApp Forward",
    status: "pending",
  },
];

export default function FakeNewsView(): React.JSX.Element {
  const [rumors, setRumors] = useState<Rumor[]>(INITIAL_RUMORS);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<Incident | null>(null);

  const issueWarning = (id: number): void => {
    setRumors((prev) =>
      prev.map((rumor) =>
        rumor.id === id ? { ...rumor, status: "warned" } : rumor
      )
    );
  };

  const runSimulation = async (scenario: "sybil_colocation" | "authentic_spatial") => {
    setSimulationLoading(true);
    setSimulationResult(null);
    try {
      const response = await axios.post(`${API_BASE}/incidents/simulate-telemetry`, {
        scenario,
        incident_type: scenario === "sybil_colocation" ? "fire" : "medical",
        location_name:
          scenario === "sybil_colocation"
            ? "Madhapur IT Hub (Device Farm)"
            : "Banjara Hills Junction (Dispersed Crowd)",
        lat: 17.4399,
        lng: 78.3908,
      });
      setSimulationResult(response.data);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ================= SECTION 1: ANTI-SPOOFING & MULTI-DEVICE SIMULATION LAB ================= */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={14} color="var(--text-secondary)" />
            <span className="panel-title">
              Anti-Spoofing & Multi-Device Verification
            </span>
          </div>
          <span className="badge neutral">
            LIVE TELEMETRY DEFENSE
          </span>
        </div>

        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: 1.5 }}>
          Real-time defense against coordinated Sybil attacks and device farms. Evaluates physical{" "}
          <strong style={{ color: "var(--text-primary)" }}>Cell Tower / Wi-Fi BSSID footprints</strong> and computes{" "}
          <strong style={{ color: "var(--text-primary)" }}>Viewing Angle Physics & Spatial Dispersion</strong>.
        </p>

        {/* Action Buttons to Trigger Scenarios */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
          <button
            onClick={() => runSimulation("sybil_colocation")}
            disabled={simulationLoading}
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {simulationLoading ? <RotateCcw size={12} className="spin" /> : <Play size={12} />}
            Simulate 3-Device Sybil Attack (Colocated BSSID)
          </button>

          <button
            onClick={() => runSimulation("authentic_spatial")}
            disabled={simulationLoading}
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {simulationLoading ? <RotateCcw size={12} className="spin" /> : <Play size={12} />}
            Simulate Authentic Multi-Witness Crowd (Triangulated)
          </button>
        </div>

        {/* Real-time Simulation Result Card */}
        {simulationResult && simulationResult.verification && (
          <div
            style={{
              padding: "14px",
              borderRadius: "6px",
              background: simulationResult.verification.is_anomaly
                ? "var(--critical-bg)"
                : "var(--success-bg)",
              border: `1px solid ${
                simulationResult.verification.is_anomaly ? "var(--critical-border)" : "var(--success-border)"
              }`,
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {simulationResult.verification.is_anomaly ? (
                  <ShieldAlert size={20} color="#ef4444" />
                ) : (
                  <CheckCircle2 size={20} color="#34d399" />
                )}
                <div>
                  <strong
                    style={{
                      fontSize: "13.5px",
                      color: simulationResult.verification.is_anomaly ? "#fca5a5" : "#6ee7b7",
                    }}
                  >
                    {simulationResult.verification.is_anomaly
                      ? "⚠️ SYBIL ATTACK CAUGHT & DEFUSED"
                      : "🛡️ AUTHENTIC CROWD CORROBORATION VERIFIED"}
                  </strong>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Incident ID: #{simulationResult.incident_id} &middot; Analyzed {simulationResult.verification.total_reports_analyzed} Sequential Reports
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "5px",
                  background: simulationResult.verification.is_anomaly ? "#991b1b" : "#065f46",
                  color: "#ffffff",
                }}
              >
                CONFIDENCE: {Math.round(simulationResult.confidence * 100)}%
                {simulationResult.verification.is_anomaly ? " (PENALIZED)" : " (BOOSTED)"}
              </span>
            </div>

            {/* 2-Column Physics & Telemetry Breakdown */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
                fontSize: "12px",
              }}
            >
              {/* Box 1: Co-Location Analysis */}
              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Wifi size={14} color="var(--text-primary)" />
                  <strong style={{ fontSize: "12.5px" }}>1. Physical Co-Location Telemetry</strong>
                </div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.5, fontSize: "12px" }}>
                  <div>
                    • Cell Tower Collision:{" "}
                    <strong style={{ color: simulationResult.verification.co_location.cell_tower_collision ? "var(--critical-text)" : "var(--success-text)" }}>
                      {simulationResult.verification.co_location.cell_tower_collision ? "YES (Identical CID)" : "NO (Diverse Towers)"}
                    </strong>
                  </div>
                  <div>
                    • Wi-Fi BSSID Footprint:{" "}
                    <strong style={{ color: simulationResult.verification.co_location.bssid_collision ? "var(--critical-text)" : "var(--success-text)" }}>
                      {simulationResult.verification.co_location.bssid_collision ? "YES (Identical Router)" : "NO (Unique Networks)"}
                    </strong>
                  </div>
                  <div>
                    • Min Inter-Device Distance:{" "}
                    <strong className="tabular-nums font-mono">{simulationResult.verification.co_location.min_inter_device_distance_meters ?? "N/A"}m</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Reason: {simulationResult.verification.co_location.reason}
                  </div>
                </div>
              </div>

              {/* Box 2: Spatial Dispersion & Viewing Angle Physics */}
              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Compass size={14} color="var(--text-primary)" />
                  <strong style={{ fontSize: "12.5px" }}>2. Viewing Angle Physics & Geometry</strong>
                </div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.5, fontSize: "12px" }}>
                  <div>
                    • Viewing Bearings:{" "}
                    <strong className="tabular-nums font-mono">
                      {simulationResult.verification.spatial_dispersion.bearings?.map((b) => `${b}°`).join(", ") || "0°"}
                    </strong>
                  </div>
                  <div>
                    • Angular Spread (&sigma;):{" "}
                    <strong className="tabular-nums font-mono" style={{ color: simulationResult.verification.spatial_dispersion.angular_spread_degrees > 40 ? "var(--success-text)" : "var(--critical-text)" }}>
                      {simulationResult.verification.spatial_dispersion.angular_spread_degrees}°
                    </strong>
                  </div>
                  <div>
                    • Quadrants Covered:{" "}
                    <strong className="tabular-nums font-mono">
                      {simulationResult.verification.spatial_dispersion.quadrants_covered} ({simulationResult.verification.spatial_dispersion.quadrant_names?.join(", ")})
                    </strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Status: {simulationResult.verification.spatial_dispersion.description}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-muted)", border: "1px solid var(--border-subtle)", padding: "9px 12px", borderRadius: "5px" }}>
              <strong>Responder Action:</strong>{" "}
              {simulationResult.verification.is_anomaly
                ? "Cluster size capped at 1. Confidence restricted to 38%. Recommends deploying a rapid patrol scout before committing ambulances/fire tenders."
                : "Authentic multi-angle crowd corroborated across 3 compass quadrants. Confidence boosted to 96%. Priority dispatch approved."}
            </div>
          </div>
        )}
      </div>

      {/* ================= SECTION 2: MISINFORMATION MONITOR (SOCIAL RUMORS) ================= */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Social Rumor Surveillance Feed</span>
        </div>

        {rumors.map((rumor) => (
          <div
            key={rumor.id}
            style={{
              border: "1px solid var(--critical-border)",
              background: "var(--critical-bg)",
              borderRadius: "var(--radius-sm)",
              padding: "12px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <AlertOctagon
                  size={16}
                  color="var(--critical)"
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />

                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {rumor.text}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      marginTop: 4,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Confidence: {rumor.confidence}% &middot; Source: {rumor.source}
                  </div>
                </div>
              </div>

              <span className="badge red">Likely Fake</span>
            </div>

            <button
              onClick={() => issueWarning(rumor.id)}
              disabled={rumor.status === "warned"}
              className="btn"
              style={{
                marginTop: "10px",
                width: "auto",
                padding: "6px 14px",
                background:
                  rumor.status === "warned" ? "var(--success-bg)" : "var(--critical)",
                color: rumor.status === "warned" ? "var(--success)" : "white",
              }}
            >
              <ShieldAlert
                size={13}
                style={{
                  verticalAlign: "-2px",
                  marginRight: 4,
                }}
              />
              {rumor.status === "warned" ? "Warning Issued ✓" : "Issue Public Warning"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}