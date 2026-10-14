import type { Incident } from "../../shared/types";
import { getIncidentLabel } from "../../shared/incidentLabels";

interface AnalyticsViewProps {
  incidents?: Incident[];
}

const TYPE_COLORS: Record<string, string> = {
  fire: "#dc2626",
  flood_rescue: "#2563eb",
  medical: "#16a34a",
  shelter: "#7c3aed",
  food: "#d97706",
  other: "#6b7280",
};

export default function AnalyticsView({
  incidents = [],
}: AnalyticsViewProps): React.JSX.Element {
  const typeCounts = incidents.reduce<Record<string, number>>((acc, incident) => {
    const type = incident.need_type ?? "other";
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  const total = incidents.length || 1;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Analytics Overview</span>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {/* Incident Types */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginBottom: "8px",
            }}
          >
            Incidents by Type
          </div>

          {Object.keys(typeCounts).length === 0 && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              No incidents yet.
            </div>
          )}

          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} style={{ marginBottom: "8px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <span>{getIncidentLabel(type)}</span>
                <span className="tabular-nums font-mono">
                  {count}
                </span>
              </div>

              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${(count / total) * 100}%`,
                    background: TYPE_COLORS[type] ?? "#888",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Scores */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginBottom: "8px",
            }}
          >
            Confidence Scores
          </div>

          {incidents.slice(0, 5).map((incident) => (
            <div
              key={incident.incident_id}
              style={{ marginBottom: "8px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <span>{incident.location_text ?? "Unknown"}</span>
                <span className="tabular-nums font-mono">
                  {Math.round((incident.confidence ?? 0) * 100)}%
                </span>
              </div>

              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${(incident.confidence ?? 0) * 100}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}