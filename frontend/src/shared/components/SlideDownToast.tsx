import React, { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface SlideDownToastProps {
  message: string | null;
  type?: "success" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}

export default function SlideDownToast({
  message,
  type = "success",
  duration = 3500,
  onClose,
}: SlideDownToastProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      setAnimatingOut(false);
      onClose?.();
    }, 280);
  }, [onClose]);

  useEffect(() => {
    if (message) {
      setVisible(true);
      setAnimatingOut(false);

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, duration, handleDismiss]);

  if (!visible || !message) return null;

  const iconMap = {
    success: <CheckCircle2 size={16} color="var(--success)" strokeWidth={2.4} />,
    warning: <AlertTriangle size={16} color="var(--warning)" strokeWidth={2.4} />,
    info: <Info size={16} color="var(--accent)" strokeWidth={2.4} />,
  };

  const borderTintMap = {
    success: "rgba(16, 185, 129, 0.35)",
    warning: "rgba(245, 158, 11, 0.35)",
    info: "rgba(2, 132, 199, 0.35)",
  };

  return (
    <>
      <style>{`
        @keyframes toastSlideDownAnimation {
          0% {
            opacity: 0;
            transform: translate(-50%, -28px) scale(0.96);
          }
          70% {
            transform: translate(-50%, 2px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes toastSlideUpAnimation {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -24px) scale(0.96);
          }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          top: "18px",
          left: "50%",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "9px 16px",
          borderRadius: "9999px",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          border: `1px solid ${borderTintMap[type] || "var(--border-strong)"}`,
          boxShadow: "0 10px 30px -4px rgba(0, 0, 0, 0.22), 0 3px 10px rgba(0, 0, 0, 0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          animation: animatingOut
            ? "toastSlideUpAnimation 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards"
            : "toastSlideDownAnimation 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          fontSize: "12.5px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          maxWidth: "92vw",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {iconMap[type]}
        </div>

        <span style={{ lineHeight: 1.4 }}>{message}</span>

        <button
          onClick={handleDismiss}
          title="Dismiss notification"
          aria-label="Dismiss"
          style={{
            background: "none",
            border: "none",
            padding: "2px",
            marginLeft: "4px",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "color 0.12s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <X size={13} strokeWidth={2.2} />
        </button>
      </div>
    </>
  );
}
