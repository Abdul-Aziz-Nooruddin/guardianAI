import { useState, useRef, useEffect } from "react";
import {
  Bell,
  User,
  ChevronDown,
  RotateCcw,
  ArrowRightLeft,
  LifeBuoy,
  Building2,
  Menu,
} from "lucide-react";
import { resetDemoState } from "../api/client";
import type { Incident } from "../types";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";

interface TopBarProps {
  role?: string;
  pendingIncidents?: Incident[];
  onSelectIncident?: (incident: Incident) => void;
  onSwitchRole?: () => void;
  onSwitchToVictim?: () => void;
  onSwitchToHospital?: (hospitalId?: string) => void;
  onToggleMobileMenu?: () => void;
}

export default function TopBar({
  role,
  pendingIncidents = [],
  onSelectIncident,
  onSwitchRole,
  onSwitchToVictim,
  onSwitchToHospital,
  onToggleMobileMenu,
}: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [resetting, setResetting] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemoState();
      window.location.reload();
    } catch (e) {
      console.error("Reset failed", e);
    } finally {
      setResetting(false);
    }
  };

  const pendingCount = pendingIncidents.length;

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="show-on-mobile"
            aria-label="Toggle navigation drawer"
            style={{
              background: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "6px 8px",
              cursor: "pointer",
              color: "var(--text-primary)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div>
          <div className="topbar-eyebrow hide-on-mobile">Hyderabad Disaster Response Network</div>
          <div className="topbar-title">
            <span>Command Center</span>
            <span className="live-badge">
              <span
                className="status-dot"
                style={{ boxShadow: "none" }}
              />
              CAD Online
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Multilingual Selector */}
        <LanguageSelector />

        {/* Global Light / Dark Theme Toggle */}
        <ThemeToggle />

        {/* Interactive Notification Bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            title="View Emergency Alerts"
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              position: "relative",
              padding: "7px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Bell size={18} />

            {pendingCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "var(--critical)",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: 700,
                  borderRadius: "10px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "38px",
                right: 0,
                width: "320px",
                background: "var(--bg-card)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-elevated)",
                border: "1px solid var(--border-subtle)",
                zIndex: 100,
                padding: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Emergency Alerts ({pendingCount})</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
                  Live Channel
                </span>
              </div>

              <div style={{ maxHeight: "260px", overflowY: "auto", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {pendingIncidents.length === 0 ? (
                  <div style={{ padding: "16px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                    No pending emergency alerts on this channel.
                  </div>
                ) : (
                  pendingIncidents.map((inc) => (
                    <div
                      key={inc.incident_id}
                      onClick={() => {
                        onSelectIncident?.(inc);
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: "8px 10px",
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        transition: "border-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--text-primary)" }}>
                        <span>{inc.need_type?.toUpperCase() || "ACCIDENT"}</span>
                        <span style={{ fontSize: "10px", color: "var(--critical)" }}>{inc.urgency?.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {inc.location_text || "Reported Location"} • {inc.victim_count || 1} reported
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interactive User & Role Switcher */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              padding: "5px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                background: "var(--bg-app)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <User size={15} />
            </div>

            <div className="hide-on-mobile" style={{ fontSize: "12px" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                Rescue Coordinator
              </div>

              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "10.5px",
                }}
              >
                {role ? role.replace("_", " ").toUpperCase() : "MEDICAL"}
              </div>
            </div>

            <ChevronDown size={13} color="var(--text-secondary)" style={{ marginLeft: "2px" }} />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                top: "44px",
                right: 0,
                width: "240px",
                background: "var(--bg-card)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-elevated)",
                border: "1px solid var(--border-subtle)",
                zIndex: 100,
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ padding: "6px 8px", fontSize: "11px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                Logged in as <strong>{role?.toUpperCase() || "MEDICAL"}</strong>
              </div>

              {onSwitchToVictim && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSwitchToVictim();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "var(--accent)",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-app)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <LifeBuoy size={14} />
                  Switch to Citizen Intake Portal
                </button>
              )}

              {onSwitchToHospital && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSwitchToHospital();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-app)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Building2 size={14} />
                  Hospital Operations & Fleet
                </button>
              )}

              {onSwitchRole && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSwitchRole();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-app)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <ArrowRightLeft size={14} />
                  Change Dispatch Agency
                </button>
              )}

              <button
                onClick={handleReset}
                disabled={resetting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--critical)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-app)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <RotateCcw size={14} className={resetting ? "spin" : ""} />
                {resetting ? "Resetting state..." : "Reset Demo Simulation"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}