import { useEffect, useRef, useState, useCallback } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, Navigation } from "lucide-react";

interface IncidentMiniMapProps {
  victimLat: number;
  victimLng: number;
  stationLat?: number;
  stationLng?: number;
  victimLocationText?: string;
  stationName?: string;
  distanceKm?: number;
  etaMinutes?: number;
  isAccepted?: boolean;
}

export default function IncidentMiniMap({
  victimLat,
  victimLng,
  stationLat,
  stationLng,
  victimLocationText = "Victim Site",
  stationName = "Station Base",
  distanceKm,
  etaMinutes,
  isAccepted = false,
}: IncidentMiniMapProps): React.JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const navUrl = stationLat && stationLng
    ? `https://www.google.com/maps/dir/?api=1&origin=${stationLat},${stationLng}&destination=${victimLat},${victimLng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${victimLat},${victimLng}&travelmode=driving`;

  const handleOpenMap = useCallback(() => {
    window.open(navUrl, "_blank", "noopener,noreferrer");
  }, [navUrl]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing instance if any
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      attributionControl: false,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    mapInstance.current = map;

    // Use OpenStreetMap tiles for clean, watermark-free rendering without API key
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Victim marker (pulsing red/amber radar dot)
    const victimIcon = L.divIcon({
      className: "victim-radar-marker",
      html: `
        <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${isAccepted ? "#10b981" : "#ef4444"}; opacity:0.4; animation: ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative; width:13px; height:13px; border-radius:50%; background:${isAccepted ? "#059669" : "#dc2626"}; border:2.5px solid #ffffff; box-shadow:0 0 10px ${isAccepted ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)"};"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const vMarker = L.marker([victimLat, victimLng], { icon: victimIcon }).addTo(map);
    vMarker.bindTooltip(victimLocationText, { permanent: false, direction: "top" });
    vMarker.on("click", handleOpenMap);

    // Station marker if coordinates exist
    if (stationLat && stationLng) {
      const stationIcon = L.divIcon({
        className: "station-base-marker",
        html: `
          <div style="width:22px; height:22px; border-radius:6px; background:#0284c7; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.4); color:white; font-size:11px; font-weight:800; cursor:pointer;">
            H
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const sMarker = L.marker([stationLat, stationLng], { icon: stationIcon }).addTo(map);
      sMarker.bindTooltip(stationName, { permanent: false, direction: "top" });
      sMarker.on("click", handleOpenMap);

      // Draw dashed trajectory line connecting station and victim
      const polyline = L.polyline([[stationLat, stationLng], [victimLat, victimLng]], {
        color: isAccepted ? "#10b981" : "#0284c7",
        weight: 3.5,
        dashArray: "5, 8",
        opacity: 0.85,
      }).addTo(map);
      polyline.on("click", handleOpenMap);

      // Fit map bounds to show both points with comfortable padding
      map.fitBounds([[stationLat, stationLng], [victimLat, victimLng]], {
        padding: [30, 30],
        maxZoom: 15,
      });
    } else {
      map.setView([victimLat, victimLng], 14);
    }

    // Direct click on map canvas triggers Google Maps navigation
    map.on("click", handleOpenMap);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [victimLat, victimLng, stationLat, stationLng, isAccepted, victimLocationText, stationName, handleOpenMap]);

  return (
    <div
      onClick={handleOpenMap}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click map to launch Google Maps driving route"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "220px",
        borderRadius: "8px",
        overflow: "hidden",
        border: isHovered
          ? "1px solid #38bdf8"
          : "1px solid rgba(56, 189, 248, 0.35)",
        boxShadow: isHovered
          ? "0 0 16px rgba(56, 189, 248, 0.35)"
          : "inset 0 0 20px rgba(0,0,0,0.3)",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {/* Map Canvas */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "220px",
          cursor: "pointer",
        }}
      />

      {/* Floating Tactical Overlay: GPS Header */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "4px",
          padding: "3px 8px",
          fontSize: "10.5px",
          color: "#f8fafc",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: isAccepted ? "#10b981" : "#ef4444",
            display: "inline-block",
          }}
        />
        <span>
          SITE GPS: {victimLat.toFixed(4)}, {victimLng.toFixed(4)}
        </span>
      </div>

      {/* Floating Tactical Overlay: Google Maps Launcher Badge */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          zIndex: 1000,
          background: isHovered ? "#0284c7" : "rgba(2, 132, 199, 0.9)",
          backdropFilter: "blur(4px)",
          border: "1px solid #38bdf8",
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "10.5px",
          color: "#ffffff",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          transition: "background 0.15s ease",
        }}
      >
        <Navigation size={11} />
        Google Maps
        <ExternalLink size={10} />
      </div>

      {/* Hover Instruction Overlay */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.92)",
            border: "1px solid #38bdf8",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          <ExternalLink size={12} color="#38bdf8" />
          Click to Open Google Maps Directions
        </div>
      )}

      {/* Floating Tactical Overlay: Distance & ETA Ribbon */}
      {distanceKm !== undefined && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            right: "8px",
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: "5px",
            padding: "5px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "#e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#94a3b8" }}>Radial:</span>
            <strong style={{ color: "#38bdf8", fontWeight: 700 }}>{distanceKm} km</strong>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#94a3b8" }}>CAD ETA:</span>
            <strong style={{ color: isAccepted ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>
              ~{etaMinutes || 5} mins
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
