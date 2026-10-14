import { useState, type KeyboardEvent, type ChangeEvent } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState<string>("");

  const handleSend = (): void => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setText(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        padding: "12px 16px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
      }}
    >
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Describe emergency in English, Telugu, Hindi, or Urdu..."
        style={{
          flex: 1,
          height: "44px",
          padding: "0 14px",
          borderRadius: "6px",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-input)",
          color: "var(--text-primary)",
          fontSize: "15px",
          outline: "none",
          fontFamily: "var(--font-body)",
          transition: "border-color 0.15s ease",
        }}
      />

      <button
        onClick={handleSend}
        style={{
          height: "44px",
          padding: "0 20px",
          borderRadius: "6px",
          border: "1px solid var(--accent)",
          background: "var(--accent)",
          color: "var(--accent-text)",
          fontWeight: 500,
          fontSize: "14px",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          transition: "opacity 0.15s ease",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Send
      </button>
    </div>
  );
}