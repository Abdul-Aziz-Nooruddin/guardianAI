import axios from "axios";
import type { Incident, IncidentAcceptance } from "../types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "http://localhost:8000/api");

export async function fetchIncidents(role?: string): Promise<Incident[]> {
  const url = role ? `${API_BASE}/incidents/?role=${role}` : `${API_BASE}/incidents/`;
  const response = await axios.get(url);
  return response.data;
}

export async function sendVictimMessage(
  message: string,
  userId: string,
  location?: { latitude: number; longitude: number; accuracy?: number },
  media?: { media_url?: string; media_type?: "image" | "video" }
): Promise<Incident> {
  const response = await axios.post(`${API_BASE}/pipeline/run`, {
    message,
    user_id: userId,
    latitude: location?.latitude,
    longitude: location?.longitude,
    accuracy: location?.accuracy,
    media_url: media?.media_url,
    media_type: media?.media_type,
  });

  return response.data;
}

export async function acceptIncident(payload: {
  incident_id: string;
  responder_id: string;
  responder_name: string;
  responder_role?: string;
  ambulance_id?: string;
  eta_minutes?: number;
  notes?: string;
}): Promise<{ status: string; record: IncidentAcceptance }> {
  const response = await axios.post(`${API_BASE}/responder/accept`, payload);
  return response.data;
}

export async function logResponderDecision(
  incidentId: string,
  decision: "approved" | "overridden"
): Promise<{ status: string; total_logged: number }> {
  const response = await axios.post(`${API_BASE}/responder/decision`, {
    incident_id: incidentId,
    decision,
  });
  return response.data;
}

export async function resetDemoState() {
  const response = await axios.post(`${API_BASE}/admin/reset`);
  return response.data;
}

export interface HospitalTelemetry {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  icu_total: number;
  icu_available: number;
  specialists: string;
  ambulances_available: number;
  ambulance_ready: boolean;
  equipment: string[];
  doctors_available?: number;
  on_duty_doctors: string[];
  emergency_hotline: string;
  status: string;
  auto_status?: boolean;
  auto_status_reason?: string;
}

export async function fetchHospitals(): Promise<HospitalTelemetry[]> {
  const response = await axios.get(`${API_BASE}/hospitals/`);
  return response.data;
}

export async function updateHospital(
  hospitalId: string,
  updates: Partial<HospitalTelemetry>
): Promise<{ status: string; message: string; hospital: HospitalTelemetry }> {
  const response = await axios.patch(`${API_BASE}/hospitals/${hospitalId}`, updates);
  return response.data;
}