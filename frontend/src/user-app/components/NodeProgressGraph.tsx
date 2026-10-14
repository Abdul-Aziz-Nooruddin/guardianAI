import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Activity,
  ShieldCheck,
  Ambulance,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { Incident, ScreenedFacility } from "../../shared/types";

interface NodeProgressGraphProps {
  incident: Incident;
}

export default function NodeProgressGraph({ incident }: NodeProgressGraphProps): React.JSX.Element {
  const [showFacilityDetails, setShowFacilityDetails] = useState(false);

  const isAccepted =
    incident.status === "accepted_en_route" ||
    incident.acceptance !== undefined;

  const acceptance = incident.acceptance;
  const targetFacility = incident.selected_facility;
  const screenedFacilities = incident.screened_facilities || [];
  const requiredEquipment = incident.action_plan?.required_equipment || [];

  const responderName =
    acceptance?.responder_name ||
    targetFacility?.hospital_name ||
    "Emergency Care Center";

  const ambulanceId =
    acceptance?.ambulance_id ||
    targetFacility?.assigned_ambulance_id ||
    "AMB-104";

  const etaMinutes =
    acceptance?.eta_minutes ??
    targetFacility?.eta_minutes ??
    7;

  // Fluid progression states
  // Step 1: Intake (immediately ready)
  // Step 2: Triage
  // Step 3: Screening
  // Step 4: Dispatch Sent
  // Step 5: Station Acceptance
  const [completedStep, setCompletedStep] = useState<number>(1);
  const [pipeProgress, setPipeProgress] = useState<{ [key: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [flowingPipe, setFlowingPipe] = useState<number | null>(null);
  const [justCompletedNode, setJustCompletedNode] = useState<number | null>(1);
  const [replayKey, setReplayKey] = useState<number>(0);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const startFluidPipeline = () => {
    clearAllTimeouts();

    // Reset pipeline to Step 1
    setCompletedStep(1);
    setJustCompletedNode(1);
    setFlowingPipe(null);
    setPipeProgress({ 1: 0, 2: 0, 3: 0, 4: 0 });

    const addTimer = (fn: () => void, delayMs: number) => {
      const timer = setTimeout(fn, delayMs);
      timeoutsRef.current.push(timer);
    };

    // Stage 1 -> 2: Fluid flows from Node 1 to Node 2
    addTimer(() => {
      setFlowingPipe(1);
      setPipeProgress((prev) => ({ ...prev, 1: 100 }));
    }, 200);

    // Node 2 Completed
    addTimer(() => {
      setFlowingPipe(null);
      setCompletedStep(2);
      setJustCompletedNode(2);
    }, 900);

    // Stage 2 -> 3: Fluid flows from Node 2 to Node 3
    addTimer(() => {
      setFlowingPipe(2);
      setPipeProgress((prev) => ({ ...prev, 2: 100 }));
    }, 1250);

    // Node 3 Completed
    addTimer(() => {
      setFlowingPipe(null);
      setCompletedStep(3);
      setJustCompletedNode(3);
    }, 1950);

    // Stage 3 -> 4: Fluid flows from Node 3 to Node 4
    addTimer(() => {
      setFlowingPipe(3);
      setPipeProgress((prev) => ({ ...prev, 3: 100 }));
    }, 2300);

    // Node 4 Completed
    addTimer(() => {
      setFlowingPipe(null);
      setCompletedStep(4);
      setJustCompletedNode(4);
    }, 3000);

    // Stage 4 -> 5: If station already accepted unit
    if (isAccepted) {
      addTimer(() => {
        setFlowingPipe(4);
        setPipeProgress((prev) => ({ ...prev, 4: 100 }));
      }, 3350);

      addTimer(() => {
        setFlowingPipe(null);
        setCompletedStep(5);
        setJustCompletedNode(5);
      }, 4050);
    }
  };

  // Trigger cascade on incident change or manual replay
  useEffect(() => {
    startFluidPipeline();
    return () => clearAllTimeouts();
  }, [incident.incident_id, replayKey]);

  // Handle station acceptance arriving dynamically after initial cascade
  useEffect(() => {
    if (isAccepted && completedStep >= 4 && pipeProgress[4] < 100) {
      setFlowingPipe(4);
      setPipeProgress((prev) => ({ ...prev, 4: 100 }));

      const timer = setTimeout(() => {
        setFlowingPipe(null);
        setCompletedStep(5);
        setJustCompletedNode(5);
      }, 700);

      timeoutsRef.current.push(timer);
    }
  }, [isAccepted, completedStep]);

  // Render individual fluid connecting pipe
  const renderFluidPipe = (pipeIndex: number) => {
    const isFilled = pipeProgress[pipeIndex] === 100;
    const isCurrentlyFlowing = flowingPipe === pipeIndex;

    return (
      <div
        style={{
          width: "4px",
          flex: 1,
          minHeight: "44px",
          background: "rgba(100, 116, 139, 0.18)",
          borderRadius: "3px",
          position: "relative",
          overflow: "hidden",
          margin: "4px 0",
          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Flowing / Filled Green Fluid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${pipeProgress[pipeIndex]}%`,
            background: "linear-gradient(180deg, #15803d 0%, #16a34a 30%, #22c55e 75%, #4ade80 100%)",
            borderRadius: "3px",
            boxShadow:
              isFilled || isCurrentlyFlowing
                ? "0 0 8px rgba(34, 197, 94, 0.7), 0 0 12px rgba(74, 222, 128, 0.4)"
                : "none",
            transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: isFilled ? "fluidShimmerPulse 3s ease-in-out infinite" : undefined,
          }}
        />

        {/* Glowing Droplet Head at the leading tip of the fluid */}
        {isCurrentlyFlowing && (
          <div
            style={{
              position: "absolute",
              left: "-2px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#86efac",
              boxShadow: "0 0 10px #22c55e, 0 0 14px #4ade80",
              animation: "fluidDripHead 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        margin: "16px 0",
        padding: "18px",
        background: "var(--bg-card)",
        borderRadius: "8px",
        border: "1px solid var(--border-subtle)",
        fontSize: "13px",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-subtle)",
        transition: "background-color 0.15s ease, border-color 0.15s ease",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "14px",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: completedStep === 5 ? "var(--success-bg)" : "var(--accent-bg)",
              border: `1px solid ${completedStep === 5 ? "var(--success)" : "var(--accent)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: completedStep === 5 ? "var(--success)" : "var(--accent)",
              transition: "all 0.3s ease",
            }}
          >
            {completedStep === 5 ? <CheckCircle2 size={18} /> : <Activity size={18} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              {completedStep === 5
                ? "Unit Dispatched & En Route"
                : "Active Dispatch Verification Pipeline"}
              {flowingPipe !== null && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "#16a34a",
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <Sparkles size={10} /> PIPELINE FLOWING
                </span>
              )}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Incident Ref:{" "}
              <span className="incident-id">
                {incident.incident_id.startsWith("inc_")
                  ? `INC-${incident.incident_id.replace(/^inc_/, "").padStart(5, "0").toUpperCase()}`
                  : incident.incident_id.toUpperCase()}
              </span>
              {" "}• Capacity-Verified CAD Routing
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setReplayKey((k) => k + 1)}
            title="Replay fluid pipeline animation"
            style={{
              background: "var(--bg-app)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-secondary)",
              fontSize: "11px",
              padding: "4px 8px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 500,
              transition: "all 0.15s ease",
            }}
          >
            <RotateCcw size={11} /> Replay
          </button>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              background: completedStep === 5 ? "var(--success-bg)" : "var(--warning-bg)",
              color: completedStep === 5 ? "var(--success)" : "var(--warning)",
              border: `1px solid ${completedStep === 5 ? "var(--success)" : "var(--warning)"}`,
              transition: "all 0.3s ease",
            }}
          >
            {completedStep === 5 ? "Unit En Route" : "Awaiting Station Acceptance"}
          </span>
        </div>
      </div>

      {/* The 5 Connected Nodes with Fluid Pipeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
        
        {/* Node 1: Intake */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#16a34a",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 8px rgba(22, 163, 74, 0.4)",
                animation: justCompletedNode === 1 ? "nodeFillPop 0.5s ease-out" : undefined,
                transition: "all 0.3s ease",
              }}
            >
              <CheckCircle2 size={14} />
            </div>
            {renderFluidPipe(1)}
          </div>

          <div style={{ paddingBottom: "14px" }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={13} color="#16a34a" />
              1. Incident Located & Logged
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Location: <strong style={{ color: "var(--text-primary)" }}>{incident.location_text || "Reported Location"}</strong>
            </div>
          </div>
        </div>

        {/* Node 2: AI Triage */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: completedStep >= 2 ? "#16a34a" : "var(--bg-app)",
                color: completedStep >= 2 ? "white" : "var(--text-muted)",
                border: completedStep >= 2 ? "none" : "1.5px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: completedStep >= 2 ? "0 0 8px rgba(22, 163, 74, 0.4)" : "none",
                animation:
                  justCompletedNode === 2
                    ? "nodeFillPop 0.5s ease-out"
                    : flowingPipe === 1
                    ? "beaconRadarPing 1s infinite"
                    : undefined,
                transition: "background 0.35s ease, border 0.35s ease, color 0.35s ease",
              }}
            >
              {completedStep >= 2 ? <CheckCircle2 size={14} /> : <Activity size={13} />}
            </div>
            {renderFluidPipe(2)}
          </div>

          <div
            style={{
              paddingBottom: "14px",
              opacity: completedStep >= 2 ? 1 : 0.45,
              transform: completedStep >= 2 ? "translateY(0)" : "translateY(2px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={13} color={completedStep >= 2 ? "#16a34a" : "var(--text-muted)"} />
              2. Clinical Urgency & Resource Triage
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Need: <span style={{ textTransform: "capitalize", fontWeight: 600, color: "var(--text-primary)" }}>{incident.need_type || "Medical"}</span> • Urgency:{" "}
              <strong style={{ color: incident.urgency === "critical" ? "var(--critical)" : "var(--warning)" }}>
                {(incident.urgency || "High").toUpperCase()}
              </strong>
            </div>
            {requiredEquipment.length > 0 && (
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                {requiredEquipment.map((eq, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "10.5px",
                      background: "var(--bg-app)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {eq.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Node 3: Facility Screening */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: completedStep >= 3 ? "#16a34a" : "var(--bg-app)",
                color: completedStep >= 3 ? "white" : "var(--text-muted)",
                border: completedStep >= 3 ? "none" : "1.5px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: completedStep >= 3 ? "0 0 8px rgba(22, 163, 74, 0.4)" : "none",
                animation:
                  justCompletedNode === 3
                    ? "nodeFillPop 0.5s ease-out"
                    : flowingPipe === 2
                    ? "beaconRadarPing 1s infinite"
                    : undefined,
                transition: "background 0.35s ease, border 0.35s ease, color 0.35s ease",
              }}
            >
              {completedStep >= 3 ? <CheckCircle2 size={14} /> : <ShieldCheck size={13} />}
            </div>
            {renderFluidPipe(3)}
          </div>

          <div
            style={{
              paddingBottom: "14px",
              flex: 1,
              opacity: completedStep >= 3 ? 1 : 0.45,
              transform: completedStep >= 3 ? "translateY(0)" : "translateY(2px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={13} color={completedStep >= 3 ? "#16a34a" : "var(--text-muted)"} />
                3. Facility Pre-Screening Verified
              </div>
              {completedStep >= 3 && (
                <button
                  onClick={() => setShowFacilityDetails((prev) => !prev)}
                  style={{
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "4px",
                    color: "var(--accent)",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                  }}
                >
                  {showFacilityDetails ? "Hide Screening" : "View Readiness Details"}
                  {showFacilityDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {screenedFacilities.length || 4} nearby facilities screened for ready ambulances and trauma capability.
            </div>

            {/* Expandable Screening Details */}
            {showFacilityDetails && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  background: "var(--bg-app)",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {screenedFacilities.map((fac: ScreenedFacility) => {
                  const isQual = fac.status === "qualified";
                  const isMut = fac.status === "mutual_aid";
                  return (
                    <div
                      key={fac.hospital_id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "var(--bg-card)",
                        border: `1px solid ${isQual ? "var(--success)" : isMut ? "var(--warning)" : "var(--critical)"}`,
                        fontSize: "11.5px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ color: "var(--text-primary)" }}>{fac.name}</strong>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "9.5px",
                            background: isQual ? "var(--success-bg)" : isMut ? "var(--warning-bg)" : "var(--critical-bg)",
                            color: isQual ? "var(--success)" : isMut ? "var(--warning)" : "var(--critical)",
                          }}
                        >
                          {isQual ? "Qualified" : isMut ? "Mutual Aid" : "Disqualified"}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", marginTop: "3px" }}>
                        Dist: {fac.distance_km} km • Ambulances: {fac.ambulances_available ?? 0} • ICU: {fac.icu_available ?? 0}
                      </div>
                      <div style={{ color: isQual ? "var(--success)" : "var(--critical)", marginTop: "2px", fontSize: "11px" }}>
                        {fac.reason}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Node 4: Alert Dispatched */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: completedStep >= 4 ? "#16a34a" : "var(--bg-app)",
                color: completedStep >= 4 ? "white" : "var(--text-muted)",
                border: completedStep >= 4 ? "none" : "1.5px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: completedStep >= 4 ? "0 0 8px rgba(22, 163, 74, 0.4)" : "none",
                animation:
                  justCompletedNode === 4
                    ? "nodeFillPop 0.5s ease-out"
                    : flowingPipe === 3
                    ? "beaconRadarPing 1s infinite"
                    : undefined,
                transition: "background 0.35s ease, border 0.35s ease, color 0.35s ease",
              }}
            >
              {completedStep >= 4 ? <CheckCircle2 size={14} /> : <ShieldCheck size={13} />}
            </div>
            {renderFluidPipe(4)}
          </div>

          <div
            style={{
              paddingBottom: "14px",
              opacity: completedStep >= 4 ? 1 : 0.45,
              transform: completedStep >= 4 ? "translateY(0)" : "translateY(2px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={13} color={completedStep >= 4 ? "#16a34a" : "var(--text-muted)"} />
              4. Priority Dispatch Sent
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Transmitted to: <strong style={{ color: "var(--text-primary)" }}>{responderName}</strong> (Channel: {(incident.responder_role || "medical").toUpperCase()})
            </div>
          </div>
        </div>

        {/* Node 5: Hospital Acceptance & En Route */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: completedStep >= 5 ? "#16a34a" : "var(--bg-app)",
                color: completedStep >= 5 ? "white" : "var(--warning)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: completedStep >= 5 ? "none" : "1.5px solid var(--warning)",
                boxShadow: completedStep >= 5 ? "0 0 10px rgba(22, 163, 74, 0.5)" : undefined,
                animation:
                  justCompletedNode === 5
                    ? "nodeFillPop 0.5s ease-out"
                    : completedStep < 5
                    ? "beaconRadarPing 2s infinite"
                    : undefined,
                transition: "background 0.35s ease, border 0.35s ease, color 0.35s ease",
              }}
            >
              {completedStep >= 5 ? <Ambulance size={14} /> : <Clock size={14} />}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                color: completedStep >= 5 ? "var(--success)" : "var(--warning)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "color 0.35s ease",
              }}
            >
              <Ambulance size={13} color={completedStep >= 5 ? "#16a34a" : "var(--warning)"} />
              5. {completedStep >= 5 ? "Dispatched & En Route" : "Awaiting Station Acceptance"}
            </div>

            {completedStep >= 5 ? (
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px 12px",
                  background: "var(--success-bg)",
                  border: "1px solid var(--success)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  animation: "nodeFillPop 0.4s ease-out",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>{responderName}</strong>
                    <div style={{ color: "var(--success)", marginTop: "2px" }}>
                      Unit: <strong>{ambulanceId}</strong> • ETA: ~<strong>{etaMinutes} mins</strong>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "var(--success)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    DEPLOYED
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Alert displayed on {responderName} console. Awaiting 1-click responder acknowledgment.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
