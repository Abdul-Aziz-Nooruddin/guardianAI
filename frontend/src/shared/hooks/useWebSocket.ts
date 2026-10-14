import { useEffect, useRef, useState } from "react";
import type { WebSocketMessage } from "../types";

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/dashboard`;
  }
  return "ws://localhost:8000/ws/dashboard";
};

const WS_URL = getWsUrl();

export function useWebSocket() {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent) => {
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        // ignore non-JSON keep-alive frames
      }
    };

    const keepAlive = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 15000);

    return () => {
      clearInterval(keepAlive);
      ws.close();
    };
  }, []);

  return lastMessage;
}