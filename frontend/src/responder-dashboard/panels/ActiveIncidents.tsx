import { MapPin, Flame, Stethoscope } from "lucide-react";
import { getSeverityColor } from "../../shared/severity";
import type { Incident } from "../../shared/types";

interface ActiveIncidentsProps {
  incidents: Incident[];
  onSelect: (incident: Incident) => void;
}

function timeAgo(timestamp?: string): string {
  if (!timestamp) return "just now";
  const utcString = timestamp.endsWith("Z") ? timestamp : `${timestamp}Z`;
  const diffMs = Date.now() - new Date(utcString).getTime();
  const mins = Math.round(diffMs / 60000);
  return mins <= 0 ? "just now" : `${mins}m ago`;
}

function formatIncidentId(id: string): string {
  if (!id) return "INC-00000";
  const clean = id.replace(/^inc_/, "");
  return `INC-${clean.padStart(5, "0").toUpperCase()}`;
}

export default function ActiveIncidents({
  incidents = [],
  onSelect,
}: ActiveIncidentsProps) {
  return (
    <div className="panel" style={{ flex: 1, minWidth: "280px" }}>
      <div className="panel-header">
        <div className="panel-title">Active Incidents ({incidents.length})</div>
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          Live CAD Feed
        </span>
      </div>

      {incidents.length === 0 && (
        <div
          style={{
            fontSize: "12.5px",
            color: "var(--text-muted)",
            padding: "24px 8px",
            textAlign: "center",
          }}
        >
          No active incidents matching your channel.
        </div>
      )}

      <div style={{ maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {incidents.map((inc) => {
          const color = getSeverityColor(inc.urgency);
          const isFire = inc.need_type === "fire" || inc.responder_role === "fire_brigade";
          const isEnRoute = inc.status === "accepted_en_route";
          const formattedId = formatIncidentId(inc.incident_id);

          return (
            <div
              key={inc.incident_id}
              className={`incident-card ${
                isEnRoute
                  ? ""
                  : color === "red"
                  ? "priority-critical"
                  : "priority-medium"
              }`}
              onClick={() => onSelect(inc)}
              style={
                isEnRoute
                  ? { borderLeft: "3px solid var(--success)", background: "var(--bg-card)" }
                  : undefined
              }
            >
              {/* Row 1: Incident ID & Status Label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span className="incident-id">{formattedId}</span>

                <span
                  className={
                    isEnRoute
                      ? "badge success"
                      : color === "red"
                      ? "badge critical"
                      : "badge medium"
                  }
                  style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em" }}
                >
                  {isEnRoute ? "EN ROUTE" : inc.urgency?.toUpperCase() || "HIGH"}
                </span>
              </div>

              {/* Row 2: Incident Title */}
              <div
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  lineHeight: 1.35,
                }}
              >
                {isFire ? (
                  <Flame size={14} color="var(--warning)" style={{ flexShrink: 0 }} />
                ) : (
                  <Stethoscope size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                )}
                <span>
                  {(inc.need_type || "Emergency Incident")
                    .replace("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>

              {/* Row 3: Location · Casualties */}
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  marginTop: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <MapPin size={11} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span>{inc.location_text || "Hyderabad"}</span>
                <span>&middot;</span>
                <span className="tabular-nums" style={{ fontWeight: 500 }}>
                  {inc.victim_count && inc.victim_count > 1
                    ? `${inc.victim_count} casualties`
                    : inc.need_type === "fire" || inc.need_type === "police"
                    ? "1 incident report"
                    : "1 victim affected"}
                </span>
              </div>

              {/* Row 4: Geodesic Coordinates (if available) */}
              {inc.latitude && inc.longitude && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "3px",
                    letterSpacing: "0.01em",
                  }}
                  className="tabular-nums"
                >
                  {inc.latitude.toFixed(4)}&deg; N &nbsp; {inc.longitude.toFixed(4)}&deg; E
                </div>
              )}

              {/* Row 5: Timestamp & Dispatch Status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "5px",
                  paddingTop: "4px",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <span className="tabular-nums">Reported {timeAgo(inc.created_at)}</span>

                {isEnRoute ? (
                  <span style={{ color: "var(--success-text)", fontWeight: 500 }}>
                    Unit {inc.acceptance?.ambulance_id || "AMB-104"} dispatched
                  </span>
                ) : (
                  <span style={{ fontSize: "10.5px" }}>Awaiting Dispatch</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}