import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "6px",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 500,
        transition: "all 0.15s ease",
      }}
      className={className}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--text-primary)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-secondary)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
    >
      {theme === "dark" ? (
        <Sun size={14} strokeWidth={2} />
      ) : (
        <Moon size={14} strokeWidth={2} />
      )}
      {showLabel && (
        <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  );
}
