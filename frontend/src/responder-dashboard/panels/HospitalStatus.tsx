import { useEffect, useState } from "react";
import { useWebSocket } from "../../shared/hooks/useWebSocket";
import { fetchHospitals, type HospitalTelemetry } from "../../shared/api/client";
import { Ambulance, Bed, Activity, Radio, ExternalLink } from "lucide-react";

interface HospitalStatusProps {
  onOpenHospitalPortal?: (hospitalId?: string) => void;
}

export default function HospitalStatus({ onOpenHospitalPortal }: HospitalStatusProps) {
  const [hospitals, setHospitals] = useState<HospitalTelemetry[]>([]);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);
  const wsMessage = useWebSocket() as { type?: string; payload?: any } | null;

  // Initial load
  useEffect(() => {
    fetchHospitals()
      .then(setHospitals)
      .catch(() => setHospitals([]));
  }, []);

  // Real-time synchronization via WebSocket
  useEffect(() => {
    if (wsMessage?.type === "hospital_update" && wsMessage.payload) {
      const updated = wsMessage.payload as HospitalTelemetry;
      setHospitals((prev) =>
        prev.map((h) => (h.id === updated.id ? { ...h, ...updated } : h))
      );
      setRecentlyUpdatedId(updated.id);
      const timer = setTimeout(() => setRecentlyUpdatedId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [wsMessage]);

  const getColor = (pct: number) => {
    if (pct >= 85) return "var(--critical)";
    if (pct >= 60) return "var(--warning)";
    return "var(--success)";
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "surging":
        return { label: "SURGE", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" };
      case "diverting":
        return { label: "DIVERTING", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" };
      default:
        return { label: "ACTIVE", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" };
    }
  };

  return (
    <div className="panel" style={{ position: "relative" }}>
      <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="panel-title">Regional Hospital Fleet & Telemetry</div>
          <span
            style={{
              fontSize: "10.5px",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Radio size={11} className="pulse-dot" /> LIVE SYNC
          </span>
        </div>

        {onOpenHospitalPortal && (
          <button
            type="button"
            onClick={() => onOpenHospitalPortal()}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 6px",
            }}
          >
            Hospital Staff Portal <ExternalLink size={12} />
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "14px",
          marginTop: "4px",
        }}
      >
        {hospitals.map((h) => {
          const occupiedPct = Math.round((1 - (h.icu_available ?? 0) / (h.icu_total || 1)) * 100);
          const isRecentlyUpdated = recentlyUpdatedId === h.id;
          const statusBadge = getStatusBadge(h.status);
          const ambCount = h.ambulances_available ?? 0;

          return (
            <div
              key={h.id || h.name}
              style={{
                background: "var(--bg-card)",
                border: isRecentlyUpdated ? "1.5px solid var(--text-primary)" : "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "border-color 0.15s ease",
                cursor: onOpenHospitalPortal ? "pointer" : "default",
              }}
              onClick={() => onOpenHospitalPortal?.(h.id)}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {h.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                    {h.area}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    color: statusBadge.color,
                    background: statusBadge.bg,
                    textTransform: "uppercase",
                  }}
                >
                  {statusBadge.label}
                </span>
              </div>

              {/* Real-time stats row: Ambulances & General Beds */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                {/* Free Ambulances pill */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    background: ambCount > 0 ? "var(--success-bg)" : "var(--critical-bg)",
                    border: `1px solid ${ambCount > 0 ? "var(--success-border)" : "var(--critical-border)"}`,
                  }}
                >
                  <Ambulance size={13} color={ambCount > 0 ? "var(--success)" : "var(--critical)"} />
                  <div className="tabular-nums" style={{ fontSize: "11.5px", fontWeight: 600, color: ambCount > 0 ? "var(--success-text)" : "var(--critical-text)", fontFamily: "var(--font-mono)" }}>
                    {ambCount} {ambCount === 1 ? "Ambulance" : "Ambulances"} Free
                  </div>
                </div>

                {/* Available beds pill */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    background: "var(--bg-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Bed size={13} color="var(--text-secondary)" />
                  <div className="tabular-nums" style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    {h.available_beds ?? 0}/{h.total_beds ?? 0} Beds
                  </div>
                </div>
              </div>

              {/* ICU Occupancy Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "3px" }}>
                  <span className="tabular-nums" style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-mono)" }}>
                    <Activity size={11} /> ICU: {h.icu_available ?? 0}/{h.icu_total ?? 0} Available
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 600, color: getColor(occupiedPct), fontFamily: "var(--font-mono)" }}>
                    {occupiedPct}% Occupied
                  </span>
                </div>
                <div className="capacity-bar" style={{ height: "5px", borderRadius: "3px" }}>
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${occupiedPct}%`,
                      background: getColor(occupiedPct),
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {isRecentlyUpdated && (
                <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500, textAlign: "right" }}>
                  Updated live
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}