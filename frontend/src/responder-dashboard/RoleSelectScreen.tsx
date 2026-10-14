import {
  Stethoscope,
  Flame,
  Shield,
  LifeBuoy,
  HeartHandshake,
  Users,
  ArrowRight,
  ArrowLeft,
  Building2,
} from "lucide-react";
import ThemeToggle from "../shared/components/ThemeToggle";

interface RoleOption {
  id: string;
  name: string;
  agencyType: string;
  description: string;
  icon: typeof Stethoscope;
  units: string;
}

const ROLES: RoleOption[] = [
  {
    id: "medical",
    name: "Medical & EMS Command",
    agencyType: "Hospital & Trauma Systems",
    description: "Trauma room capacity, ambulance fleets, ICU triage verification, and incoming critical casualty intake.",
    icon: Stethoscope,
    units: "4 Connected Hospitals • 11 Ambulances",
  },
  {
    id: "fire_brigade",
    name: "Fire & Rescue Operations",
    agencyType: "Fire Department Dispatch",
    description: "Substation engine dispatch, aerial ladder platforms, foam tenders, and HAZMAT structural rescue squads.",
    icon: Flame,
    units: "3 Stations • 8 Engines Ready",
  },
  {
    id: "disaster_management",
    name: "Disaster Management Authority",
    agencyType: "State & Regional NDRF",
    description: "Cross-agency command authority for floods, building collapses, mass-casualty events, and evacuation corridors.",
    icon: LifeBuoy,
    units: "Full Multi-Agency Feed",
  },
  {
    id: "police",
    name: "Police & Traffic Control",
    agencyType: "Law Enforcement CAD",
    description: "Emergency green-corridor clearance, incident perimeter security, traffic diversions, and crowd control.",
    icon: Shield,
    units: "Central Traffic CAD Active",
  },
  {
    id: "ngo",
    name: "Relief & Shelter Coordination",
    agencyType: "Humanitarian Logistics",
    description: "Evacuation shelters, clean water tankers, mobile meal distribution, and non-medical relief supplies.",
    icon: HeartHandshake,
    units: "12 Shelters Cataloged",
  },
  {
    id: "volunteer_coordinator",
    name: "Civil Volunteer Corps",
    agencyType: "Community First-Responders",
    description: "Trained neighborhood search squads, casualty assist teams, and civilian relief workforce deployment.",
    icon: Users,
    units: "Active Volunteer Network",
  },
];

interface RoleSelectScreenProps {
  onSelectRole: (role: string) => void;
  onBack?: () => void;
  onSwitchToHospital?: () => void;
}

export default function RoleSelectScreen({
  onSelectRole,
  onBack,
  onSwitchToHospital,
}: RoleSelectScreenProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.15s ease, color 0.15s ease",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-card)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: "5px",
                color: "var(--text-secondary)",
                padding: "5px 9px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                fontSize: "12px",
                transition: "border-color 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          )}

          <span style={{ fontWeight: 600, fontSize: "14px", letterSpacing: "-0.01em" }}>
            Guardian Dispatch Network
          </span>

          <span className="hide-on-mobile" style={{ color: "var(--border-strong)", margin: "0 2px" }}>
            /
          </span>

          <span className="hide-on-mobile" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Agency Authentication
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
          {onSwitchToHospital && (
            <button
              onClick={onSwitchToHospital}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                borderRadius: "5px",
                padding: "5px 10px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "border-color 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            >
              <Building2 size={13} />
              <span>Hospital Staff Portal</span>
            </button>
          )}

          <div
            className="hide-on-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-secondary)",
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "4px",
              background: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span className="status-dot" />
            <span>CAD Gateway Online</span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Agency Directory */}
      <main
        style={{
          flex: 1,
          maxWidth: "1080px",
          width: "100%",
          margin: "0 auto",
          padding: "36px 20px 48px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <div
            className="micro-label"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: "6px",
            }}
          >
            Terminal Authorization
          </div>

          <h1
            className="page-title"
            style={{
              fontSize: "32px",
              lineHeight: "40px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
              color: "var(--text-primary)",
            }}
          >
            Select Authorized Dispatch Terminal
          </h1>

          <p
            className="body-base"
            style={{
              fontSize: "14px",
              lineHeight: "21px",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Each terminal receives incidents matched to the agency’s active fleet capability and jurisdiction.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "14px",
          }}
        >
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "border-color 0.12s ease, background-color 0.12s ease",
                  color: "inherit",
                  boxShadow: "var(--shadow-subtle)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                  e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--bg-card)";
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "5px",
                        background: "var(--bg-muted)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Icon size={16} strokeWidth={2.2} />
                    </div>

                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 500,
                        color: "var(--text-muted)",
                        background: "var(--bg-muted)",
                        border: "1px solid var(--border-subtle)",
                        padding: "2px 7px",
                        borderRadius: "3px",
                      }}
                    >
                      {role.agencyType}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      margin: "0 0 5px",
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {role.name}
                  </h3>

                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.45,
                      margin: "0 0 16px",
                    }}
                  >
                    {role.description}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "11.5px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{role.units}</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Open Console <ArrowRight size={13} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}