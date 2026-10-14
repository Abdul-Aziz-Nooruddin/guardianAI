import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { Incident } from "../../shared/types";

interface AIActionPlanProps {
  incident: Incident | null;
}

export default function AIActionPlan({
  incident,
}: AIActionPlanProps): React.JSX.Element {
  const [status, setStatus] = useState<
    "pending" | "approved" | "overridden"
  >("pending");

  if (!incident) {
    return (
      <div className="panel" style={{ flex: 1, minWidth: "280px" }}>
        <div className="panel-header">
          <span className="panel-title">Dispatch Recommendation</span>
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            padding: "16px 0",
          }}
        >
          Awaiting active incident telemetry for automated dispatch synthesis.
        </div>
      </div>
    );
  }

  const {
    action_plan,
    reasoning,
    confidence,
    urgency,
    victim_count,
  } = incident;

  const distributionPlan = action_plan?.distribution_plan ?? [];
  const reasoningList = reasoning ?? [];

  const logDecision = async (
    decision: "approved" | "overridden"
  ): Promise<void> => {
    setStatus(decision);

    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/responder/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            incident_id: incident.incident_id,
            decision,
          }),
        }
      );
    } catch (e) {
      console.error("Failed to log decision", e);
    }
  };

  return (
    <div className="panel" style={{ flex: 1, minWidth: "280px" }}>
      <div className="panel-header">
        <span
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          Dispatch Recommendation
        </span>

        <span
          className="badge neutral tabular-nums"
          style={{ fontSize: "11px", fontWeight: 600 }}
        >
          {Math.round(confidence * 100)}% Match Confidence
        </span>
      </div>

      <div
        style={{
          fontSize: "12.5px",
          color: "var(--text-secondary)",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span className="tabular-nums" style={{ fontWeight: 500 }}>
          {victim_count} {victim_count === 1 ? "victim" : "victims"}
        </span>
        <span>&middot;</span>
        <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
          {urgency} Priority
        </span>
      </div>

      {/* Allocation breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {distributionPlan.map((plan, index) => (
          <div key={index} className="plan-row">
            <span style={{ fontWeight: 500, fontSize: "13px" }}>{plan.hospital_name}</span>
            <span className="plan-victims tabular-nums">
              {plan.victims_assigned} assigned &middot; {plan.beds_available} beds free
            </span>
          </div>
        ))}
      </div>

      {/* Operational Rationale */}
      <div className="reasoning-box" style={{ marginTop: "12px", padding: "10px 12px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "6px",
          }}
        >
          Tactical Rationale
        </div>
        {reasoningList.map((reason, index) => (
          <div
            key={index}
            className="reasoning-item"
            style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--text-primary)" }}
          >
            <CheckCircle2
              size={13}
              color="var(--success)"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      {/* Action Controls */}
      <div className="btn-row" style={{ marginTop: "14px" }}>
        {status === "pending" && (
          <>
            <button
              className="btn btn-approve"
              onClick={() => logDecision("approved")}
              style={{ padding: "8px 14px", fontSize: "13px", fontWeight: 500 }}
            >
              <CheckCircle2 size={14} style={{ marginRight: 6 }} />
              Approve Plan
            </button>

            <button
              className="btn btn-override"
              onClick={() => logDecision("overridden")}
              style={{ padding: "8px 12px", fontSize: "13px", fontWeight: 500 }}
            >
              <AlertTriangle size={14} style={{ marginRight: 6 }} />
              Override Plan
            </button>
          </>
        )}

        {status === "approved" && (
          <button className="btn btn-approved" disabled style={{ fontSize: "13px" }}>
            <CheckCircle2 size={14} style={{ marginRight: 6 }} /> Plan Approved & Transmitted
          </button>
        )}

        {status === "overridden" && (
          <button className="btn btn-override" disabled style={{ fontSize: "13px" }}>
            <AlertTriangle size={14} style={{ marginRight: 6 }} /> Dispatch Plan Overridden
          </button>
        )}
      </div>
    </div>
  );
}