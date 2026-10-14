import { useEffect, useRef } from "react";
import L, { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSeverityColor } from "../../shared/severity";
import type { Incident } from "../../shared/types";
import { Crosshair, Radio } from "lucide-react";

interface LiveMapProps {
  incidents: Incident[];
  activeIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
}

const HYDERABAD_CENTER: [number, number] = [17.4374, 78.4482];

const COLOR_MAP: Record<"red" | "yellow" | "green", string> = {
  red: "#dc2626",
  yellow: "#d97706",
  green: "#16a34a",
};

export default function LiveMap({
  incidents = [],
  activeIncident = null,
  onSelectIncident,
}: LiveMapProps): React.ReactElement {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markersLayer = useRef<LayerGroup | null>(null);
  const markersMap = useRef<Map<string, L.Marker>>(new Map());

  // Initialize Map
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
    }).setView(HYDERABAD_CENTER, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;
  }, []);

  // Update Markers and Handle Real-time Location Pointing
  useEffect(() => {
    if (!markersLayer.current || !mapInstance.current) return;

    markersLayer.current.clearLayers();
    markersMap.current.clear();

    const validCoords: [number, number][] = [];

    incidents.forEach((inc) => {
      const lat = inc.latitude ?? HYDERABAD_CENTER[0];
      const lng = inc.longitude ?? HYDERABAD_CENTER[1];
      validCoords.push([lat, lng]);

      const isCurrentActive =
        activeIncident && activeIncident.incident_id === inc.incident_id;

      const color =
        COLOR_MAP[getSeverityColor(inc.urgency) as "red" | "yellow" | "green"];

      const victimCount = inc.victim_count || 1;

      const icon = L.divIcon({
        className: "custom-cad-radar-marker",
        html: `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <!-- Outer Pulsing Radar Ring -->
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: ${color};
              opacity: ${isCurrentActive ? "0.6" : "0.35"};
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>

            <!-- Active Focus Indicator Ring -->
            ${
              isCurrentActive
                ? `<div style="
                    position: absolute;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    border: 2px dashed #ffffff;
                    animation: spin 6s linear infinite;
                  "></div>`
                : ""
            }

            <!-- Inner Solid Victim Count Badge -->
            <div style="
              position: relative;
              background: ${color};
              color: white;
              font-family: var(--font-mono, 'JetBrains Mono', monospace);
              font-weight: 800;
              font-size: 13px;
              width: ${isCurrentActive ? "32px" : "28px"};
              height: ${isCurrentActive ? "32px" : "28px"};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 10px ${color}88, 0 2px 5px rgba(0,0,0,0.4);
              border: 2px solid #ffffff;
              transition: all 0.2s ease;
            ">
              ${victimCount}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(markersLayer.current!);
      markersMap.current.set(inc.incident_id, marker);

      marker.on("click", () => {
        if (onSelectIncident) {
          onSelectIncident(inc);
        }
      });

      const stLat = inc.selected_facility?.latitude || HYDERABAD_CENTER[0];
      const stLng = inc.selected_facility?.longitude || HYDERABAD_CENTER[1];
      const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${stLat},${stLng}&destination=${lat},${lng}&travelmode=driving`;

      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a; min-width: 220px; padding: 4px 0;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 3px;">
            ${inc.location_text || "Reported Victim Site"}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E ${inc.gps_verified ? '• <span style="color:#0284c7;font-weight:700;">LIVE GPS</span>' : ''}
          </div>
          <div style="font-size: 11.5px; color: #334155; margin-bottom: 4px;">
            Victims Affected: <strong style="color: ${color}; font-size: 12.5px;">${victimCount} ${victimCount === 1 ? "Victim" : "Casualties"}</strong>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            Emergency: <strong style="text-transform: capitalize;">${(inc.need_type || "Emergency").replace("_", " ")}</strong> • Urgency: <strong style="color: ${color}; text-transform: uppercase;">${inc.urgency || "High"}</strong>
          </div>
          <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #0284c7; color: #ffffff; padding: 6px 10px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 11.5px;">
            Open Route in Google Maps ➔
          </a>
        </div>
      `);
    });

    // Auto-focus map to victim location:
    // 1. If an active incident is selected, fly directly to that victim's location
    if (activeIncident && activeIncident.latitude && activeIncident.longitude) {
      mapInstance.current.flyTo(
        [activeIncident.latitude, activeIncident.longitude],
        14,
        { duration: 1.2 }
      );
      const targetMarker = markersMap.current.get(activeIncident.incident_id);
      if (targetMarker) {
        targetMarker.openPopup();
      }
    } else if (validCoords.length === 1) {
      // 2. If exactly one emergency request exists, point right to that victim's location
      mapInstance.current.setView(validCoords[0], 14);
    } else if (validCoords.length > 1) {
      // 3. If multiple emergency requests are coming from different locations, show real-time bounds across all locations
      const bounds = L.latLngBounds(validCoords);
      mapInstance.current.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [incidents, activeIncident, onSelectIncident]);

  // Handler to manually re-center on all distress calls
  const handleRecenterAll = () => {
    if (!mapInstance.current || incidents.length === 0) return;
    const coords: [number, number][] = incidents
      .filter((i) => i.latitude && i.longitude)
      .map((i) => [i.latitude!, i.longitude!]);

    if (coords.length === 1) {
      mapInstance.current.flyTo(coords[0], 14, { duration: 0.8 });
    } else if (coords.length > 1) {
      mapInstance.current.fitBounds(L.latLngBounds(coords), {
        padding: [40, 40],
        maxZoom: 15,
      });
    } else {
      mapInstance.current.setView(HYDERABAD_CENTER, 12);
    }
  };

  return (
    <div className="panel" style={{ flex: 2, minWidth: "320px", display: "flex", flexDirection: "column" }}>
      <div
        className="panel-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Radio size={15} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
            Live Map — Hyderabad Disaster Grid
          </h3>
          <span
            className="badge"
            style={{
              fontSize: "10px",
              padding: "2px 7px",
              background: incidents.length > 0 ? "var(--critical-bg)" : "var(--bg-muted)",
              color: incidents.length > 0 ? "var(--critical)" : "var(--text-muted)",
              border: `1px solid ${incidents.length > 0 ? "var(--critical-border)" : "var(--border-subtle)"}`,
            }}
          >
            {incidents.length} {incidents.length === 1 ? "Victim Location" : "Victim Locations"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleRecenterAll}
          className="btn btn-secondary"
          style={{
            padding: "4px 9px",
            fontSize: "11px",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
          title="Fit map viewport to all active incident coordinates"
        >
          <Crosshair size={12} />
          <span>Point to All Requests</span>
        </button>
      </div>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
        }}
      />
    </div>
  );
}