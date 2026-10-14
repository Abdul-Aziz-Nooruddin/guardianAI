import { useState } from "react";
import { useLanguage, type SupportedLanguage } from "../../shared/context/LanguageContext";

interface SettingsViewProps {
  role?: string;
}

export default function SettingsView({
  role,
}: SettingsViewProps) {
  const [notifyCritical, setNotifyCritical] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const { language, setLanguage } = useLanguage();

  return (
    <div className="panel" style={{ maxWidth: "420px" }}>
      <div className="panel-header">
        <span className="panel-title">Settings</span>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Active Role
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            textTransform: "capitalize",
          }}
        >
          {role?.replace("_", " ") || "Unknown"}
        </div>
      </div>

      <label
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "13px",
        }}
      >
        Notify on critical incidents
        <input
          type="checkbox"
          checked={notifyCritical}
          onChange={(e) => setNotifyCritical(e.target.checked)}
        />
      </label>

      <label
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "13px",
        }}
      >
        Auto-refresh dashboard
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
        />
      </label>

      <div
        style={{
          padding: "10px 0",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            marginBottom: 6,
          }}
        >
          Dashboard language
        </div>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: "12.5px",
          }}
        >
          <option value="en">English (English)</option>
          <option value="te">తెలుగు (Telugu)</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="ur">اردو (Urdu)</option>
        </select>
      </div>
    </div>
  );
}