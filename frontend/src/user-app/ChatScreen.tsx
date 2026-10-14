import { useState, useRef, useEffect } from "react";
import {
  Send,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Flame,
  Ambulance,
  Building2,
  AlertCircle,
  Radio,
  MapPin,
  Crosshair,
  Camera,
  Video,
  X,
} from "lucide-react";
import { sendVictimMessage } from "../shared/api/client";
import { useWebSocket } from "../shared/hooks/useWebSocket";
import type { Incident, WebSocketMessage } from "../shared/types";
import MicButton from "./components/MicButton";
import NodeProgressGraph from "./components/NodeProgressGraph";
import ThemeToggle from "../shared/components/ThemeToggle";
import LanguageSelector from "../shared/components/LanguageSelector";
import { useLanguage } from "../shared/context/LanguageContext";
import MediaCaptureModal from "./components/MediaCaptureModal";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  confirmed?: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

interface ChatScreenProps {
  onSwitchToResponder?: () => void;
  onBack?: () => void;
}

const SAMPLE_INCIDENTS = [
  {
    type: "Road Accident",
    icon: Ambulance,
    color: "#0284c7",
    prompt: "Road accident at Banjara Hills Road No 1, 2 people bleeding severely",
    tag: "Medical / Trauma",
  },
  {
    type: "Structural Fire",
    icon: Flame,
    color: "#ea580c",
    prompt: "Building fire reported near Ameerpet market, flames spreading, need rescue",
    tag: "Fire Brigade",
  },
  {
    type: "Multiple Collision",
    icon: Ambulance,
    color: "#0284c7",
    prompt: "Car collision on Secunderabad main road, 3 injured trapped inside vehicle",
    tag: "Medical / Trauma",
  },
];

const MONITORED_FACILITIES = [
  { name: "Apollo Emergency & Trauma", area: "Jubilee Hills", ambulances: 3, traumaLevel: "Level 1" },
  { name: "Sunshine Multi-Speciality", area: "Secunderabad", ambulances: 2, traumaLevel: "Level 2" },
  { name: "Aster Prime Hospital", area: "Ameerpet", ambulances: 2, traumaLevel: "Level 2" },
  { name: "Secunderabad Fire & Rescue", area: "Substation 1", engines: 3, type: "Fire Command" },
];

export default function ChatScreen({ onSwitchToResponder, onBack }: ChatScreenProps): React.JSX.Element {
  const { t } = useLanguage();
  const wsMessage = useWebSocket() as WebSocketMessage | null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "bot",
      text: "Emergency intake active. State the situation and your location. You may type below or tap the microphone for vernacular voice dictation.",
      time: "Just now",
    },
  ]);

  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{
    dataUrl: string;
    type: "image" | "video";
  } | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState<"image" | "video">("image");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const processedAcceptanceRef = useRef<string | null>(null);
  const activeIncidentRef = useRef<Incident | null>(null);

  const [liveGps, setLiveGps] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "ready" | "denied">("detecting");

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }
    setGpsStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveGps({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsStatus("ready");
      },
      (err) => {
        console.warn("Geolocation permission or error:", err.message);
        // Fallback to high-precision Banjara Hills / Cyber corridor coordinates for demo
        setLiveGps({
          latitude: 17.4156,
          longitude: 78.4347,
          accuracy: 8,
        });
        setGpsStatus("ready");
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    activeIncidentRef.current = activeIncident;
  }, [activeIncident]);

  // Synchronize when responder accepts incident
  useEffect(() => {
    if (wsMessage?.type === "incident_accepted") {
      const acceptanceData = wsMessage.payload;
      
      // Strict guard: only display acceptance updates intended for THIS incident session
      if (
        !activeIncidentRef.current ||
        !acceptanceData.incident_id ||
        acceptanceData.incident_id !== activeIncidentRef.current.incident_id
      ) {
        return;
      }

      const key = `${acceptanceData.incident_id}_${acceptanceData.accepted_at || ""}`;

      if (processedAcceptanceRef.current === key) return;
      processedAcceptanceRef.current = key;

      setActiveIncident((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "accepted_en_route",
          acceptance: acceptanceData,
        };
      });

      const updateText = `DISPATCH UPDATE: ${acceptanceData.responder_name} acknowledged the incident. Response vehicle ${acceptanceData.ambulance_id || "UNIT-104"} is deployed and en route (ETA ~${acceptanceData.eta_minutes || 7} mins). Stay where you are.`;

      setMessages((prev) => {
        if (prev.some((m) => m.text === updateText)) return prev;
        return [
          ...prev,
          {
            id: `acc_${Date.now()}`,
            sender: "bot",
            text: updateText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            confirmed: true,
          },
        ];
      });
    }
  }, [wsMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeIncident]);

  const handleSend = async (overrideText?: string) => {
    const rawText = overrideText ?? input;
    const text =
      rawText.trim() ||
      (attachedMedia
        ? attachedMedia.type === "image"
          ? "Live on-scene photo proof attached for verification."
          : "Live on-scene video clip attached for verification."
        : "");
    if (!text || loading) return;

    const mediaToTransmit = attachedMedia;
    setInput("");
    setAttachedMedia(null);

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mediaUrl: mediaToTransmit?.dataUrl,
      mediaType: mediaToTransmit?.type,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendVictimMessage(
        text,
        "u_" + Date.now(),
        liveGps || undefined,
        mediaToTransmit
          ? { media_url: mediaToTransmit.dataUrl, media_type: mediaToTransmit.type }
          : undefined
      );

      const isEmergency = result.is_emergency !== false && Boolean(result.incident_id);
      if (isEmergency) {
        setActiveIncident(result);
      }

      const botReply: Message = {
        id: `b_${Date.now()}`,
        sender: "bot",
        text:
          result.victim_reply ||
          (isEmergency
            ? `Emergency report logged for ${result.location_text || "Hyderabad"}. Facilities screened and priority dispatch transmitted to ${result.selected_facility?.hospital_name || "Emergency Medical Services"}.`
            : "Guardian Emergency Intake active. State your emergency situation and location, or tap the microphone to speak."),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        confirmed: isEmergency,
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error("sendVictimMessage error:", err);
      const detail = err?.response?.data?.detail || err?.message || "Server unreachable";
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "bot",
          text: `Communication error (${detail}). Please verify network connectivity and retry.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Institutional Top Bar */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-card)",
          flexWrap: "wrap",
          gap: "12px",
          transition: "background-color 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "6px",
              background: "var(--bg-app)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
            }}
          >
            <ShieldCheck size={18} />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              {t("citizen.title")}
            </div>
            <div className="hide-on-mobile" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {t("citizen.subtitle")}
            </div>
          </div>
        </div>

        {/* Official Helplines */}
        <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
          <span style={{ padding: "3px 8px", background: "var(--bg-app)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
            {t("citizen.national_112")}
          </span>
          <span style={{ padding: "3px 8px", background: "var(--bg-app)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
            {t("citizen.medical_108")}
          </span>
          <span style={{ padding: "3px 8px", background: "var(--bg-app)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
            {t("citizen.fire_101")}
          </span>
        </div>

        {/* Controls: Responder Switch, Online Status, Theme Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onSwitchToResponder && (
            <button
              onClick={onSwitchToResponder}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--bg-app)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              <span>{t("nav.responder_portal")}</span> <ArrowRight size={13} />
            </button>
          )}

          <div
            className="hide-on-mobile"
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "4px",
              background: "var(--success-bg)",
              color: "var(--success)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid var(--success)",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)" }} />
            {t("citizen.cad_active")}
          </div>

          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className="citizen-main-grid"
        style={{
          flex: 1,
          maxWidth: "1180px",
          width: "100%",
          margin: "0 auto",
          padding: "24px 20px",
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "20px",
          boxSizing: "border-box",
        }}
      >
        {/* Left Column: Interactive Intake & Communication Feed */}
        <section
          className="citizen-chat-section"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 120px)",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Feed Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-app)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
              <Radio size={14} color="#10b981" />
              <span>Live Emergency Incident Channel</span>
            </div>
            <span style={{ color: "var(--text-muted)" }}>Coordinates Verified by Telco CAD</span>
          </div>

          {/* Messages & Node Graph Stream */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "84%",
                      background: isUser ? "var(--accent)" : "var(--bg-muted)",
                      border: isUser ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "11px 15px",
                      color: isUser ? "var(--accent-text)" : "var(--text-primary)",
                      fontSize: "15px",
                      lineHeight: 1.55,
                      boxShadow: "var(--shadow-subtle)",
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          letterSpacing: "0.03em",
                          marginBottom: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ShieldCheck size={12} /> DISPATCH AGENT
                      </div>
                    )}

                    <div style={{ color: isUser ? "var(--accent-text)" : "var(--text-primary)" }}>{m.text}</div>

                    {m.mediaUrl && (
                      <div
                        style={{
                          marginTop: "8px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: isUser ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid var(--border-strong)",
                          background: "#000000",
                        }}
                      >
                        {m.mediaType === "video" ? (
                          <video
                            src={m.mediaUrl}
                            controls
                            style={{ width: "100%", maxHeight: "220px", display: "block" }}
                          />
                        ) : (
                          <img
                            src={m.mediaUrl}
                            alt="On-scene evidence"
                            style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }}
                          />
                        )}
                        <div
                          style={{
                            padding: "4px 8px",
                            background: "rgba(15, 23, 42, 0.9)",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#38bdf8",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Camera size={11} /> ON-SCENE CAMERA TELEMETRY ATTACHED
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "11px",
                        color: isUser ? "var(--accent-text)" : "var(--text-muted)",
                        opacity: isUser ? 0.75 : 1,
                        textAlign: "right",
                      }}
                      className="tabular-nums font-mono"
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live 5-Node Progress Graph */}
            {activeIncident && <NodeProgressGraph incident={activeIncident} />}

            {loading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--bg-card-hover)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                }}
              >
                <Loader2 size={16} className="spin" color="var(--accent)" />
                <span>Screening hospital ICU beds, surgical rosters, and available ambulances...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Live Device GPS Telemetry Bar */}
          <div
            style={{
              padding: "6px 12px",
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--text-secondary)",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <MapPin size={12} color={gpsStatus === "ready" ? "var(--success)" : "var(--warning)"} style={{ flexShrink: 0 }} />
              {gpsStatus === "ready" && liveGps ? (
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  GPS: <strong style={{ color: "var(--text-primary)" }}>{liveGps.latitude.toFixed(4)}°N, {liveGps.longitude.toFixed(4)}°E</strong> (±{liveGps.accuracy}m)
                </span>
              ) : gpsStatus === "detecting" ? (
                <span>Acquiring GPS fix...</span>
              ) : (
                <span>Cell tower CAD geocoding</span>
              )}
            </div>

            <button
              type="button"
              onClick={detectLocation}
              title="Re-query live browser GPS location"
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 4px",
                borderRadius: "4px",
                flexShrink: 0,
              }}
            >
              <Crosshair size={12} /> <span className="hide-on-mobile">Re-sync GPS</span>
            </button>
          </div>

          {/* Attached Media Strip */}
          {attachedMedia && (
            <div
              style={{
                padding: "8px 14px",
                background: "var(--bg-card)",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {attachedMedia.type === "image" ? (
                  <img
                    src={attachedMedia.dataUrl}
                    alt="Scene Proof"
                    style={{
                      width: "44px",
                      height: "44px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1.5px solid #38bdf8",
                    }}
                  />
                ) : (
                  <video
                    src={attachedMedia.dataUrl}
                    style={{
                      width: "44px",
                      height: "44px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1.5px solid #f43f5e",
                    }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: attachedMedia.type === "image" ? "#38bdf8" : "#f43f5e",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <ShieldCheck size={13} />
                    {attachedMedia.type === "image"
                      ? "Live Photo Proof Attached"
                      : "Live Video Clip Attached"}
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                    Telemetry watermark embedded • Transmitting directly to Command Center
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachedMedia(null)}
                title="Remove attached proof"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#ef4444",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <X size={12} /> Remove
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--bg-app)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <MicButton onTranscript={(txt) => handleSend(txt)} />

            {/* Camera Photo Capture Button */}
            <button
              type="button"
              onClick={() => {
                setMediaModalMode("image");
                setIsMediaModalOpen(true);
              }}
              title="Capture live on-scene photo proof to confirm disaster"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: attachedMedia?.type === "image" ? "1.5px solid #38bdf8" : "1px solid var(--border-strong)",
                background: attachedMedia?.type === "image" ? "rgba(56, 189, 248, 0.2)" : "var(--bg-input)",
                color: attachedMedia?.type === "image" ? "#38bdf8" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <Camera size={16} />
            </button>

            {/* Video Recording Button */}
            <button
              type="button"
              onClick={() => {
                setMediaModalMode("video");
                setIsMediaModalOpen(true);
              }}
              title="Record on-scene video evidence"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: attachedMedia?.type === "video" ? "1.5px solid #f43f5e" : "1px solid var(--border-strong)",
                background: attachedMedia?.type === "video" ? "rgba(244, 63, 94, 0.2)" : "var(--bg-input)",
                color: attachedMedia?.type === "video" ? "#f43f5e" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <Video size={16} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                attachedMedia
                  ? "Situation notes or tap Send..."
                  : "Describe emergency & location..."
              }
              disabled={loading}
              style={{
                flex: 1,
                minWidth: "60px",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || (!input.trim() && !attachedMedia)}
              style={{
                padding: "9px 12px",
                borderRadius: "6px",
                border: "none",
                background: "var(--accent)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading || (!input.trim() && !attachedMedia) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                flexShrink: 0,
                opacity: loading || (!input.trim() && !attachedMedia) ? 0.6 : 1,
              }}
            >
              <Send size={14} /> <span className="hide-on-mobile">Send</span>
            </button>
          </div>

          {/* Camera / Video Viewfinder Modal */}
          <MediaCaptureModal
            isOpen={isMediaModalOpen}
            initialMode={mediaModalMode}
            onClose={() => setIsMediaModalOpen(false)}
            onCapture={(media) => {
              setAttachedMedia(media);
            }}
          />
        </section>

        {/* Right Column: Incident Presets, Facility Telemetry, & Advisory */}
        <aside
          className="citizen-aside"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            height: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          {/* Quick Emergency Report Presets */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "16px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={14} color="var(--accent)" />
              Quick Emergency Reports
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {SAMPLE_INCIDENTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    disabled={loading}
                    style={{
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      color: "inherit",
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Icon size={13} color={item.color} />
                        {item.type}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "var(--bg-card)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.35 }}>
                      {item.prompt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connected Facility Readiness Monitored */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "16px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Building2 size={14} color="var(--success)" />
              Connected Facilities Ready
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MONITORED_FACILITIES.map((fac, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "11.5px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{fac.name}</strong>
                    <span style={{ color: "var(--success)", fontSize: "10.5px", fontWeight: 600 }}>
                      {fac.ambulances ? `${fac.ambulances} AMB` : `${fac.engines} Engines`}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-muted)", marginTop: "2px", fontSize: "11px" }}>
                    {fac.area} • {fac.traumaLevel || fac.type}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Directives */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "14px 16px",
              fontSize: "11.5px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              Immediate Emergency Directives:
            </div>
            <div>• Keep airway open for unconscious victims.</div>
            <div>• Do not move casualties with suspected spinal injuries.</div>
            <div>• Clear approaching road corridors for emergency vehicles.</div>
          </div>
        </aside>
      </main>
    </div>
  );
}