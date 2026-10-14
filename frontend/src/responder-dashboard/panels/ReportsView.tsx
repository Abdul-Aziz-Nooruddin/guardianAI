import { Download } from "lucide-react";
import type { Incident } from "../../shared/types";
import { getIncidentLabel } from "../../shared/incidentLabels";

interface ReportsViewProps {
  incidents?: Incident[];
}

function formatIncidentId(id: string): string {
  if (!id) return "INC-00000";
  const clean = id.replace(/^inc_/, "");
  return `INC-${clean.padStart(5, "0").toUpperCase()}`;
}

export default function ReportsView({
  incidents = [],
}: ReportsViewProps): React.JSX.Element {
  const exportCSV = (): void => {
    const header =
      "Incident ID,Location,Type,Urgency,Victims,Confidence,Time\n";

    const rows = incidents
      .map(
        (i) =>
          `${formatIncidentId(i.incident_id)},${i.location_text ?? ""},${getIncidentLabel(
            i.need_type
          )},${i.urgency},${i.victim_count},${i.confidence},${
            i.created_at ?? ""
          }`
      )
      .join("\n");

    const blob = new Blob([header + rows], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "guardianai_incident_report.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-title">Incident Audit & Compliance Log</span>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Operational dispatch records for cross-agency verification
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="btn btn-secondary"
          style={{
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "12px",
          }}
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {incidents.length === 0 ? (
        <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
            No incident records available
          </div>
          <div>
            Dispatched incidents matching this channel will be logged here for audit and reporting.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              fontSize: "13px",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border-subtle)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>ID</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Location</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Type</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Urgency</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Victims</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Match Confidence</th>
              </tr>
            </thead>

            <tbody>
              {incidents.map((incident) => (
                <tr
                  key={incident.incident_id}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <span className="incident-id">
                      {formatIncidentId(incident.incident_id)}
                    </span>
                  </td>

                  <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontWeight: 500 }}>
                    {incident.location_text ?? "Hyderabad"}
                  </td>

                  <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
                    {getIncidentLabel(incident.need_type)}
                  </td>

                  <td style={{ padding: "10px 12px" }}>
                    <span
                      className={
                        incident.urgency === "critical"
                          ? "badge critical"
                          : "badge medium"
                      }
                      style={{ fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase" }}
                    >
                      {incident.urgency}
                    </span>
                  </td>

                  <td
                    className="tabular-nums"
                    style={{
                      padding: "10px 12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {incident.victim_count}
                  </td>

                  <td
                    className="tabular-nums"
                    style={{
                      padding: "10px 12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                    }}
                  >
                    {Math.round((incident.confidence ?? 0) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}