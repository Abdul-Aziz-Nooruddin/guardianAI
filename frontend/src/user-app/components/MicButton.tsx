import { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { useLanguage } from "../../shared/context/LanguageContext";

interface MicButtonProps {
  onTranscript: (transcript: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function MicButton({
  onTranscript,
}: MicButtonProps): React.JSX.Element {
  const { speechCode } = useLanguage();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is supported in Chrome, Edge, and Safari.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = speechCode || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <button
      onClick={listening ? stopListening : startListening}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "6px",
        border: "1px solid var(--border-subtle)",
        background: listening ? "var(--critical)" : "var(--bg-card)",
        color: listening ? "#ffffff" : "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.15s ease",
      }}
      title={listening ? "Listening... click to stop" : "Voice dictation"}
    >
      {listening ? <Square size={14} /> : <Mic size={15} />}
    </button>
  );
}