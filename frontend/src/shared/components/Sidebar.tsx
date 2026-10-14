import {
  LayoutDashboard,
  AlertCircle,
  Map,
  Building2,
  Package,
  Radio,
  Users,
  BarChart3,
  FileText,
  Settings,
  X,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  active: string;
  onNavigate: (view: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Command Center", icon: LayoutDashboard },
  { label: "Incidents", icon: AlertCircle },
  { label: "Live Map", icon: Map },
  { label: "Hospitals", icon: Building2 },
  { label: "Resources", icon: Package },
  { label: "Fake News", icon: Radio },
  { label: "Volunteers", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
];

const AGENTS: string[] = [
  "Victim Assistance",
  "Emergency Intelligence",
  "Resource Finder",
  "NGO Dashboard",
];

export default function Sidebar({
  active,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const handleItemClick = (label: string) => {
    onNavigate(label);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="sidebar-backdrop show-on-mobile"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpenMobile ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-title">
            <img
              src="/favicon.png"
              alt="GuardianAI"
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "5px",
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 700 }}>GuardianAI</span>
            <span
              style={{
                fontSize: "9px",
                padding: "1px 5px",
                borderRadius: "3px",
                background: "var(--bg-muted)",
                color: "var(--text-muted)",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              CAD
            </span>
          </div>

          {/* Close button inside mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="show-on-mobile"
              aria-label="Close menu drawer"
              style={{
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "5px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          )}

          <div className="sidebar-brand-sub hide-on-mobile">
            Hyderabad Operations Network
          </div>
        </div>

        <div className="sidebar-nav">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className={`sidebar-item ${
                active === label ? "active" : ""
              }`}
              onClick={() => handleItemClick(label)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-agents">
          <div className="sidebar-agents-title">
            AI Agents Status
          </div>

          {AGENTS.map((name) => (
            <div key={name} className="agent-row">
              <span>{name}</span>
              <span className="status-dot" />
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}