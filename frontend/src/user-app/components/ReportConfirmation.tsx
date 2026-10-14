interface ReportConfirmationProps {
  shelterInfo: unknown;
}

export default function ReportConfirmation({
  shelterInfo,
}: ReportConfirmationProps) {
  if (!shelterInfo) return null;

  return (
    <div
      style={{
        background: "var(--success-bg)",
        border: "1px solid var(--success-border)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 12px",
        marginTop: "8px",
        fontSize: "12.5px",
        color: "var(--success-text)",
        fontWeight: 500,
      }}
    >
      Report received — Rescue team notified
    </div>
  );
}