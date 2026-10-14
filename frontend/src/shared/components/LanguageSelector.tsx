import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: LanguageSelectorProps): React.JSX.Element {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Select Interface Language"
        aria-label="Language selection"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          padding: compact ? "4px 8px" : "5px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "border-color 0.12s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      >
        <Globe size={13} style={{ color: "var(--text-secondary)" }} />
        <span>{compact ? currentOption.code.toUpperCase() : currentOption.nativeLabel}</span>
        <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: "160px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -4px rgba(0, 0, 0, 0.18)",
            padding: "4px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "5px",
                  border: "none",
                  background: isSelected ? "var(--bg-muted)" : "transparent",
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: isSelected ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-muted)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div>
                  <div>{opt.nativeLabel}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{opt.label}</div>
                </div>
                {isSelected && <Check size={13} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
