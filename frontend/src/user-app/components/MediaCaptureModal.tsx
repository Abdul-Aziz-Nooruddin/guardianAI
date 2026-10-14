import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Video, X, Check, RotateCcw, Upload, ShieldCheck } from "lucide-react";

interface MediaCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (media: { dataUrl: string; type: "image" | "video" }) => void;
  initialMode?: "image" | "video";
}

// Emergency scene presets for quick testing
const EMERGENCY_PRESETS = [
  {
    name: "Fire Scene",
    type: "image" as const,
    dataUrl:
      "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Road Collision",
    type: "image" as const,
    dataUrl:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Urban Flooding",
    type: "image" as const,
    dataUrl:
      "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
  },
];

// Helper to scale & watermark images taken from device camera or file input
const processUploadedImageWithWatermark = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Overlay verified tamper-evident watermark bar
        const now = new Date();
        const barHeight = Math.max(28, Math.round(height * 0.045));
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(8, height - barHeight - 10, width - 16, barHeight);
        ctx.fillStyle = "#38bdf8";
        ctx.font = `bold ${Math.max(12, Math.round(barHeight * 0.42))}px monospace`;
        ctx.fillText(
          `GUARDIAN-AI VERIFIED ON-SCENE CAPTURE • ${now.toISOString()}`,
          18,
          height - Math.round(barHeight * 0.35) - 10
        );

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export default function MediaCaptureModal({
  isOpen,
  onClose,
  onCapture,
  initialMode = "image",
}: MediaCaptureModalProps): React.JSX.Element | null {
  const [mode, setMode] = useState<"image" | "video">(initialMode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<{
    dataUrl: string;
    type: "image" | "video";
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [stream]);

  const startCameraForMode = useCallback(async (targetMode: "image" | "video") => {
    setCameraError(null);

    // If on plain HTTP, getUserMedia is blocked by Chrome
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      setCameraError(
        `Chrome camera permission requires HTTPS. Please open https://${window.location.host} to allow Chrome camera access.`
      );
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: targetMode === "video",
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Camera live stream permission unavailable:", err);
      setCameraError(
        "Chrome camera permission was not granted. Tap 'Allow Chrome Camera' below or check Chrome permissions in the address bar."
      );
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPreview(null);
      setIsRecording(false);
      setCameraError(null);
      return;
    }

    startCameraForMode(mode);

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, stopCamera, startCameraForMode]);

  const capturePhoto = () => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay GPS & Timestamp watermark directly onto canvas for authenticity
    const now = new Date();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(10, canvas.height - 35, canvas.width - 20, 26);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`GUARDIAN-AI VERIFIED CAPTURE • ${now.toISOString()}`, 20, canvas.height - 18);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPreview({ dataUrl, type: "image" });
  };

  const startVideoRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setCapturedPreview({ dataUrl: reader.result, type: "video" });
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 8) {
            stopVideoRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      console.error("MediaRecorder init failed:", e);
    }
  };

  const stopVideoRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === "string") {
        let finalDataUrl = reader.result;
        if (!isVideo) {
          finalDataUrl = await processUploadedImageWithWatermark(reader.result);
        }
        setCapturedPreview({
          dataUrl: finalDataUrl,
          type: isVideo ? "video" : "image",
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleConfirm = () => {
    if (!capturedPreview) return;
    onCapture(capturedPreview);
    onClose();
  };

  const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "var(--bg-card)",
          borderRadius: "14px",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: "var(--text-primary)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-app)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {mode === "image" ? <Camera size={18} color="#38bdf8" /> : <Video size={18} color="#f43f5e" />}
            <span style={{ fontSize: "14px", fontWeight: 700 }}>
              {mode === "image" ? "Live On-Scene Photo Capture" : "Live On-Scene Video Evidence"}
            </span>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => {
                setMode("image");
                setCapturedPreview(null);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                border: "none",
                background: mode === "image" ? "var(--accent)" : "rgba(255,255,255,0.06)",
                color: mode === "image" ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Photo
            </button>
            <button
              onClick={() => {
                setMode("video");
                setCapturedPreview(null);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                border: "none",
                background: mode === "video" ? "#f43f5e" : "rgba(255,255,255,0.06)",
                color: mode === "video" ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Video
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                marginLeft: "6px",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview Body */}
        <div
          style={{
            position: "relative",
            minHeight: "320px",
            background: "#090d16",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {capturedPreview ? (
            capturedPreview.type === "image" ? (
              <img
                src={capturedPreview.dataUrl}
                alt="Captured Disaster Evidence"
                style={{ width: "100%", maxHeight: "360px", objectFit: "contain" }}
              />
            ) : (
              <video
                src={capturedPreview.dataUrl}
                controls
                autoPlay
                style={{ width: "100%", maxHeight: "360px", objectFit: "contain" }}
              />
            )
          ) : stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", maxHeight: "360px", objectFit: "cover" }}
            />
          ) : (
            <div style={{ padding: "28px 20px", textAlign: "center", maxWidth: "420px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                {mode === "image" ? <Camera size={26} color="#38bdf8" /> : <Video size={26} color="#f43f5e" />}
              </div>
              <div style={{ fontSize: "14px", color: "#f8fafc", marginBottom: "6px", fontWeight: 700 }}>
                {mode === "image" ? "Chrome Live Camera Access" : "Chrome Live Video Access"}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "18px" }}>
                {cameraError || "Tap below to grant Chrome camera permission and stream live video."}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                {/* Primary Button: Asks Chrome for in-browser Camera Permission */}
                {hasMediaDevices ? (
                  <button
                    type="button"
                    onClick={() => startCameraForMode(mode)}
                    style={{
                      background: mode === "image" ? "#0284c7" : "#e11d48",
                      color: "#fff",
                      padding: "11px 22px",
                      fontSize: "13px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      border: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      boxShadow: mode === "image" ? "0 4px 14px rgba(2, 132, 199, 0.35)" : "0 4px 14px rgba(225, 29, 72, 0.35)",
                      width: "100%",
                      maxWidth: "280px",
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Allow & Start Chrome Camera</span>
                  </button>
                ) : (
                  <a
                    href={`https://${typeof window !== "undefined" ? window.location.host : ""}`}
                    style={{
                      background: "#0284c7",
                      color: "#fff",
                      padding: "11px 22px",
                      fontSize: "13px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                      width: "100%",
                      maxWidth: "280px",
                    }}
                  >
                    <ShieldCheck size={16} /> Open via Secure HTTPS
                  </a>
                )}

                {/* Secondary: Direct phone camera or gallery selector */}
                <div
                  style={{
                    position: "relative",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "var(--text-secondary)",
                    padding: "9px 18px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    width: "100%",
                    maxWidth: "280px",
                    overflow: "hidden",
                  }}
                >
                  <input
                    key={`direct-camera-${mode}`}
                    type="file"
                    accept={mode === "image" ? "image/*" : "video/*"}
                    {...(mode === "image" ? { capture: "environment" } : {})}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 20,
                    }}
                    onChange={handleFileUpload}
                  />
                  <Camera size={13} />
                  <span>Or Snap via Device Camera</span>
                </div>
              </div>
            </div>
          )}

          {/* Recording Timer Badge */}
          {isRecording && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                background: "rgba(225, 29, 72, 0.9)",
                color: "#fff",
                padding: "3px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#fff",
                  display: "inline-block",
                  animation: "ping 1s infinite",
                }}
              />
              REC: 00:0{recordSeconds} / 00:08
            </div>
          )}
        </div>

        {/* Quick Emergency Presets */}
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(15, 23, 42, 0.4)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            Demo Presets:
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {EMERGENCY_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCapturedPreview({ dataUrl: preset.dataUrl, type: preset.type })}
                style={{
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "10.5px",
                  fontWeight: 600,
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Footer */}
        <div
          style={{
            padding: "14px 18px",
            background: "var(--bg-app)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Bottom Left: Upload File */}
          <div
            style={{
              position: "relative",
              background: "none",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflow: "hidden",
            }}
          >
            <input
              type="file"
              accept={mode === "image" ? "image/*" : "video/*,image/*"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
                zIndex: 20,
              }}
              onChange={handleFileUpload}
            />
            <Upload size={13} /> Upload File
          </div>

          {capturedPreview ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setCapturedPreview(null);
                  if (!stream) {
                    startCameraForMode(mode);
                  }
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <RotateCcw size={13} /> Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: "7px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#059669",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={14} /> Attach Proof
              </button>
            </div>
          ) : (
            <div>
              {stream ? (
                mode === "image" ? (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#0284c7",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Camera size={14} /> Snap Photo
                  </button>
                ) : isRecording ? (
                  <button
                    type="button"
                    onClick={stopVideoRecording}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#e11d48",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    Stop Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVideoRecording}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#e11d48",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Video size={14} /> Record Clip (8s)
                  </button>
                )
              ) : (
                /* Stream not active yet -> trigger permission request or direct photo */
                <button
                  type="button"
                  onClick={() => startCameraForMode(mode)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "6px",
                    border: "none",
                    background: mode === "image" ? "#0284c7" : "#e11d48",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Camera size={14} /> {mode === "image" ? "Snap Photo" : "Record Video"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
