import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Users,
  Building2,
  ShieldCheck,
  Clock,
  Zap,
  TrendingDown,
} from "lucide-react";

import Sidebar, { NAV_ITEMS } from "../shared/components/Sidebar";
import TopBar from "../shared/components/TopBar";
import StatCard from "../shared/components/StatCard";

import ActiveIncidents from "./panels/ActiveIncidents";
import LiveMap from "./panels/LiveMap";
import AIActionPlan from "./panels/AIActionPlan";
import HospitalStatus from "./panels/HospitalStatus";
import ResourcesView from "./panels/ResourcesView";
import FakeNewsView from "./panels/FakeNewsView";
import VolunteersView from "./panels/VolunteersView";
import AnalyticsView from "./panels/AnalyticsView";
import ReportsView from "./panels/ReportsView";
import SettingsView from "./panels/SettingsView";
import EmergencyAlertBanner from "./panels/EmergencyAlertBanner";

import { canView } from "../shared/permissions";
import { useWebSocket } from "../shared/hooks/useWebSocket";
import { fetchIncidents } from "../shared/api/client";
import type { Incident, WebSocketMessage } from "../shared/types";

interface CommandCenterProps {
  role: string;
  onSwitchRole?: () => void;
  onSwitchToVictim?: () => void;
  onSwitchToHospital?: (hospitalId?: string) => void;
}

const isIncidentRelevant = (incident: Incident, userRole: string): boolean => {
  if (userRole === "ngo" || userRole === "disaster_management") {
    return true;
  }
  const need = (incident.need_type || "").toLowerCase();
  const respRole = (incident.responder_role || "").toLowerCase();

  if (userRole === "medical") {
    return respRole === "medical" || need === "medical" || need === "accident" || need === "road_accident" || need === "trauma";
  }
  if (userRole === "fire_brigade") {
    return respRole === "fire_brigade" || need === "fire" || need === "burns" || need === "explosion";
  }
  if (userRole === "police") {
    return respRole === "police" || need === "police" || need === "traffic" || need === "crime";
  }
  if (userRole === "volunteer_coordinator") {
    return need === "shelter" || need === "food" || respRole === "volunteer_coordinator";
  }
  return respRole === userRole;
};

export default function CommandCenter({
  role,
  onSwitchRole,
  onSwitchToVictim,
  onSwitchToHospital,
}: CommandCenterProps): React.JSX.Element {
  const wsMessage = useWebSocket() as WebSocketMessage | null;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [view, setView] = useState<string>("Command Center");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Load existing incidents on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchIncidents();
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data);
          const relevant = data.filter((i) => isIncidentRelevant(i, role));
          if (relevant.length > 0) {
            setActiveIncident(relevant[0]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch initial incidents", e);
      }
    };
    loadData();
  }, [role]);

  // Handle live WebSocket events with strict role filtering
  useEffect(() => {
    if (wsMessage?.type === "incident_update") {
      const incident = wsMessage.payload as Incident;

      setIncidents((prev) => {
        const exists = prev.find(
          (i) => i.incident_id === incident.incident_id
        );

        if (exists) {
          return prev.map((i) =>
            i.incident_id === incident.incident_id ? incident : i
          );
        }

        return [incident, ...prev];
      });

      // ONLY set as active alert if strictly relevant to this responder's role
      if (isIncidentRelevant(incident, role)) {
        setActiveIncident(incident);
      }
    } else if (wsMessage?.type === "incident_accepted") {
      const acceptedData = wsMessage.payload;

      setIncidents((prev) =>
        prev.map((i) =>
          i.incident_id === acceptedData.incident_id
            ? {
                ...i,
                status: "accepted_en_route",
                acceptance: acceptedData,
              }
            : i
        )
      );

      setActiveIncident((prev) => {
        if (!prev || prev.incident_id !== acceptedData.incident_id) return prev;
        return {
          ...prev,
          status: "accepted_en_route",
          acceptance: acceptedData,
        };
      });
    }
  }, [wsMessage, role]);

  const visibleIncidents = incidents.filter((i) => isIncidentRelevant(i, role));

  // If active incident is not relevant to this role, reset to first relevant incident
  useEffect(() => {
    if (activeIncident && !isIncidentRelevant(activeIncident, role)) {
      setActiveIncident(visibleIncidents[0] || null);
    } else if (!activeIncident && visibleIncidents.length > 0) {
      setActiveIncident(visibleIncidents[0]);
    }
  }, [role, visibleIncidents, activeIncident]);

  const pendingAlerts = visibleIncidents.filter(
    (i) => i.status !== "accepted_en_route"
  );

  const handleIncidentAccepted = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.incident_id === incidentId
          ? { ...i, status: "accepted_en_route" }
          : i
      )
    );
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        onNavigate={setView}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="app-content-area">
        <TopBar
          role={role}
          pendingIncidents={pendingAlerts}
          onSelectIncident={setActiveIncident}
          onSwitchRole={onSwitchRole}
          onSwitchToVictim={onSwitchToVictim}
          onSwitchToHospital={onSwitchToHospital}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Mobile Horizontal Quick Navigation Tab Strip */}
        <nav className="mobile-view-tabs show-on-mobile" aria-label="Mobile Navigation Tabs">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setView(label)}
              className={`mobile-view-tab ${view === label ? "active" : ""}`}
            >
              <Icon size={13} />
              <span>{label}</span>
              {label === "Incidents" && visibleIncidents.length > 0 && (
                <span className="mobile-tab-badge">{visibleIncidents.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="app-main-scroll">
          {/* Tactical SLA & Performance Engine Bar */}
          <div className="tactical-engine-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "4px",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-primary)",
                }}
              >
                <Zap size={12} />
              </div>
              <strong style={{ color: "var(--text-primary)", letterSpacing: "0.01em", fontSize: "11.5px" }}>
                TACTICAL CAD ENGINE
              </strong>
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "3px",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "10px",
                  letterSpacing: "0.03em",
                }}
              >
                {role.replace("_", " ").toUpperCase()} CHANNEL
              </span>
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "center", fontSize: "11.5px", flexWrap: "wrap" }}>
              <span>
                Avg Triage: <strong className="tabular-nums" style={{ color: "var(--success-text)", fontFamily: "var(--font-mono)" }}>1.4s</strong>{" "}
                <span style={{ color: "var(--text-muted)" }}>(vs 4.2m manual)</span>
              </span>
              <span>
                Golden Hour Match: <strong className="tabular-nums" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>98.6%</strong>
              </span>
              <span>
                Deduplication: <strong className="tabular-nums" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>84%</strong>
              </span>
              <span className="tabular-nums" style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--success-text)", fontFamily: "var(--font-mono)" }}>
                <TrendingDown size={12} />
                -$14.2k Cost Avoidance
              </span>
            </div>
          </div>

          <div className="stat-row">
            <StatCard
              icon={<AlertTriangle size={18} color="var(--critical)" />}
              iconBg="var(--critical-bg)"
              label="Assigned Incidents"
              value={visibleIncidents.length}
              sub={`+${pendingAlerts.length} pending action`}
            />

            <StatCard
              icon={<Users size={18} color="var(--accent)" />}
              iconBg="var(--accent-glow)"
              label="People Assisted"
              value={visibleIncidents.reduce(
                (sum, incident) => sum + (incident.victim_count || 1),
                0
              )}
            />

            <StatCard
              icon={<Building2 size={18} color="var(--success)" />}
              iconBg="var(--success-bg)"
              label="Stations Active"
              value="4"
            />

            <StatCard
              icon={<ShieldCheck size={18} color="var(--warning)" />}
              iconBg="var(--warning-bg)"
              label="AI Verification"
              value={
                activeIncident
                  ? `${Math.round(activeIncident.confidence * 100)}%`
                  : "96%"
              }
            />

            <StatCard
              icon={<Clock size={18} color="var(--accent)" />}
              iconBg="var(--accent-glow)"
              label="Fleet Turnaround"
              value="5m 20s"
            />
          </div>

          {/* Interactive Emergency Alert Banners: render as many banners as persons requesting emergency response */}
          {pendingAlerts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pendingAlerts.map((inc) => (
                <EmergencyAlertBanner
                  key={inc.incident_id}
                  incident={inc}
                  userRole={role}
                  onAccepted={handleIncidentAccepted}
                  onSwitchToHospital={onSwitchToHospital}
                />
              ))}
            </div>
          ) : activeIncident && isIncidentRelevant(activeIncident, role) ? (
            <EmergencyAlertBanner
              incident={activeIncident}
              userRole={role}
              onAccepted={handleIncidentAccepted}
              onSwitchToHospital={onSwitchToHospital}
            />
          ) : null}

          {view === "Command Center" && (
            <>
              <div className="panel-grid">
                {canView(role, "incidents") && (
                  <ActiveIncidents
                    incidents={visibleIncidents}
                    onSelect={setActiveIncident}
                  />
                )}

                {canView(role, "map") && (
                  <LiveMap
                    incidents={visibleIncidents}
                    activeIncident={activeIncident}
                    onSelectIncident={setActiveIncident}
                  />
                )}

                {canView(role, "action_plan") && (
                  <AIActionPlan incident={activeIncident} />
                )}
              </div>

              {canView(role, "hospitals") && (
                <div className="view-container-padded" style={{ paddingTop: 0 }}>
                  <HospitalStatus onOpenHospitalPortal={onSwitchToHospital} />
                </div>
              )}
            </>
          )}

          {view === "Incidents" && (
            <div className="view-container-padded">
              <ActiveIncidents
                incidents={visibleIncidents}
                onSelect={setActiveIncident}
              />
            </div>
          )}

          {view === "Live Map" && (
            <div className="view-container-padded">
              <LiveMap
                incidents={visibleIncidents}
                activeIncident={activeIncident}
                onSelectIncident={setActiveIncident}
              />
            </div>
          )}

          {view === "Hospitals" && (
            <div className="view-container-padded">
              <HospitalStatus onOpenHospitalPortal={onSwitchToHospital} />
            </div>
          )}

          {view === "Resources" && (
            <div className="view-container-padded">
              <ResourcesView />
            </div>
          )}

          {view === "Fake News" && (
            <div className="view-container-padded">
              <FakeNewsView />
            </div>
          )}

          {view === "Volunteers" && (
            <div className="view-container-padded">
              <VolunteersView />
            </div>
          )}

          {view === "Analytics" && (
            <div className="view-container-padded">
              <AnalyticsView incidents={visibleIncidents} />
            </div>
          )}

          {view === "Reports" && (
            <div className="view-container-padded">
              <ReportsView incidents={visibleIncidents} />
            </div>
          )}

          {view === "Settings" && (
            <div className="view-container-padded">
              <SettingsView role={role} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}