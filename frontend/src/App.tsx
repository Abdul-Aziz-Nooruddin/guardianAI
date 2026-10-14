import { useState, useEffect } from "react";
import { ArrowRight, Building2, ExternalLink } from "lucide-react";
import ChatScreen from "./user-app/ChatScreen";
import RoleSelectScreen from "./responder-dashboard/RoleSelectScreen";
import CommandCenter from "./responder-dashboard/CommandCenter";
import HospitalPortal from "./hospital-portal/HospitalPortal";
import ThemeToggle from "./shared/components/ThemeToggle";
import LanguageSelector from "./shared/components/LanguageSelector";
import { useLanguage } from "./shared/context/LanguageContext";

function getInitialPortal(): "user" | "responder" | "hospital" | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const portal = params.get("portal") || params.get("mode");
  if (portal === "hospital") return "hospital";
  if (portal === "responder") return "responder";
  if (portal === "user" || portal === "citizen") return "user";
  return null;
}

function getInitialRole(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("role");
}

function getInitialHospitalId(): string {
  if (typeof window === "undefined") return "h_c";
  const params = new URLSearchParams(window.location.search);
  return params.get("hospital") || "h_c";
}

export function getPortalUrl(
  portalMode: "user" | "responder" | "hospital",
  extraParams?: Record<string, string>
): string {
  if (typeof window === "undefined") return "#";
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("portal", portalMode);
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

export function openPortalInNewTab(
  portalMode: "user" | "responder" | "hospital",
  extraParams?: Record<string, string>
): void {
  const targetUrl = getPortalUrl(portalMode, extraParams);
  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

function App() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"user" | "responder" | "hospital" | null>(getInitialPortal);
  const [role, setRole] = useState<string | null>(getInitialRole);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(getInitialHospitalId);

  // Synchronize state with URL parameters upon browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setMode(getInitialPortal());
      setRole(getInitialRole());
      setSelectedHospitalId(getInitialHospitalId());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updateUrlHistory = (
    newMode: "user" | "responder" | "hospital" | null,
    newRole?: string | null,
    newHospitalId?: string | null
  ) => {
    const url = new URL(window.location.href);
    if (newMode) {
      url.searchParams.set("portal", newMode);
    } else {
      url.searchParams.delete("portal");
      url.searchParams.delete("mode");
    }
    if (newRole) {
      url.searchParams.set("role", newRole);
    } else {
      url.searchParams.delete("role");
    }
    if (newHospitalId) {
      url.searchParams.set("hospital", newHospitalId);
    } else {
      url.searchParams.delete("hospital");
    }
    window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
  };

  const handleBackToPortals = () => {
    setMode(null);
    setRole(null);
    updateUrlHistory(null);
  };

  if (mode === "user") {
    return (
      <ChatScreen
        onSwitchToResponder={() => openPortalInNewTab("responder")}
        onBack={handleBackToPortals}
      />
    );
  }

  if (mode === "hospital") {
    return (
      <HospitalPortal
        initialHospitalId={selectedHospitalId}
        onBackToRoles={handleBackToPortals}
        onSwitchToResponder={() => {
          openPortalInNewTab("responder", { role: "medical" });
        }}
        onSwitchToCitizen={() => openPortalInNewTab("user")}
      />
    );
  }

  if (mode === "responder" && role) {
    return (
      <CommandCenter
        role={role}
        onSwitchRole={() => {
          setRole(null);
          updateUrlHistory("responder", null);
        }}
        onSwitchToVictim={() => openPortalInNewTab("user")}
        onSwitchToHospital={(hId) => {
          openPortalInNewTab("hospital", hId ? { hospital: hId } : undefined);
        }}
      />
    );
  }

  if (mode === "responder") {
    return (
      <RoleSelectScreen
        onSelectRole={(r) => {
          setRole(r);
          updateUrlHistory("responder", r);
        }}
        onBack={handleBackToPortals}
        onSwitchToHospital={() => openPortalInNewTab("hospital")}
      />
    );
  }

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
      {/* Editorial Navigation Header */}
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
          <img
            src="/favicon.png"
            alt="GuardianAI Logo"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              objectFit: "contain",
              display: "block",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              GuardianAI
            </span>
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "3px",
                background: "var(--bg-muted)",
                color: "var(--text-muted)",
                fontWeight: 500,
                letterSpacing: "0.03em",
              }}
            >
              CAD 2.0
            </span>
          </div>

          <span className="hide-on-mobile" style={{ color: "var(--border-strong)", margin: "0 4px" }}>
            /
          </span>

          <span
            className="hide-on-mobile"
            style={{ fontSize: "12px", color: "var(--text-muted)" }}
          >
            Hyderabad Emergency Operations
          </span>
        </div>

        {/* Global Controls & Live Node Telemetry */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            className="hide-on-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "var(--text-secondary)",
              padding: "4px 9px",
              borderRadius: "4px",
              background: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span className="status-dot" />
            <span>{t("nav.telemetry_summary")}</span>
          </div>

          <a
            href={getPortalUrl("hospital")}
            target="_blank"
            rel="noopener noreferrer"
            className="hide-on-mobile"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              padding: "5px 10px",
              borderRadius: "5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              transition: "border-color 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          >
            <Building2 size={13} />
            <span>{t("nav.hospital_portal")}</span>
            <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>

          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Operational Selection View */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "36px 20px 48px",
          maxWidth: "1080px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px", maxWidth: "640px" }}>
          <div
            className="micro-label"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: "8px",
            }}
          >
            {t("landing.tag")}
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
            {t("landing.title")}
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
            {t("landing.subtitle")}
          </p>
        </div>

        {/* 3 Editorial Portals Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          {/* Portal 1: Citizen Distress */}
          <div
            onClick={() => openPortalInNewTab("user")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "var(--shadow-subtle)",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 7px",
                  borderRadius: "4px",
                  background: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  marginBottom: "14px",
                  border: "1px solid var(--border-subtle)",
                  letterSpacing: "0.02em",
                }}
              >
                {t("landing.citizen_badge")}
              </div>

              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 6px",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("landing.citizen_title")}
              </h2>

              <p
                style={{
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  margin: "0 0 20px",
                }}
              >
                {t("landing.citizen_desc")}
              </p>
            </div>

            <a
              href={getPortalUrl("user")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid var(--accent)",
                background: "var(--accent)",
                color: "var(--accent-text)",
                fontSize: "12.5px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                textDecoration: "none",
                boxSizing: "border-box",
                transition: "opacity 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span>{t("landing.citizen_btn")}</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Portal 2: Responder Dispatch */}
          <div
            onClick={() => openPortalInNewTab("responder")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "var(--shadow-subtle)",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 7px",
                  borderRadius: "4px",
                  background: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  marginBottom: "14px",
                  border: "1px solid var(--border-subtle)",
                  letterSpacing: "0.02em",
                }}
              >
                {t("landing.responder_badge")}
              </div>

              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 6px",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("landing.responder_title")}
              </h2>

              <p
                style={{
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  margin: "0 0 20px",
                }}
              >
                {t("landing.responder_desc")}
              </p>
            </div>

            <a
              href={getPortalUrl("responder")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "12.5px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                textDecoration: "none",
                boxSizing: "border-box",
                transition: "background-color 0.12s ease, border-color 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-muted)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-card)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              <span>{t("landing.responder_btn")}</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Portal 3: Hospital Operations & Fleet Console */}
          <div
            onClick={() => openPortalInNewTab("hospital")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "var(--shadow-subtle)",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 7px",
                  borderRadius: "4px",
                  background: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  marginBottom: "14px",
                  border: "1px solid var(--border-subtle)",
                  letterSpacing: "0.02em",
                }}
              >
                {t("landing.hospital_badge")}
              </div>

              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 6px",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("landing.hospital_title")}
              </h2>

              <p
                style={{
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  margin: "0 0 20px",
                }}
              >
                {t("landing.hospital_desc")}
              </p>
            </div>

            <a
              href={getPortalUrl("hospital")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-muted)",
                color: "var(--text-primary)",
                fontSize: "12.5px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                textDecoration: "none",
                boxSizing: "border-box",
                transition: "border-color 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            >
              <span>{t("landing.hospital_btn")}</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Agency Integrations Status */}
        <div
          className="hide-on-mobile"
          style={{
            marginTop: "28px",
            padding: "8px 16px",
            borderRadius: "6px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "14px",
            fontSize: "11px",
            color: "var(--text-muted)",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span>{t("landing.footer")}</span>
        </div>
      </main>
    </div>
  );
}

export default App;