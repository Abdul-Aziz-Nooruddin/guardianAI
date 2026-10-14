export type Urgency = "critical" | "high" | "medium" | "low";

export interface DistributionPlan {
  hospital_id?: string;
  hospital_name: string;
  area?: string;
  distance_km?: number;
  victims_assigned: number;
  beds_available: number;
  ambulances_available?: number;
  status?: string;
  reason?: string;
  emergency_hotline?: string;
}

export interface ScreenedFacility {
  hospital_id: string;
  name: string;
  area: string;
  distance_km: number;
  status: "qualified" | "mutual_aid" | "disqualified";
  score: number;
  reason: string;
  ambulances_available?: number;
  fire_engines_available?: number;
  patrol_cars_available?: number;
  tow_trucks_available?: number;
  icu_available?: number;
  available_beds?: number;
  doctors_available?: number;
  equipment: string[];
  matched_equipment?: string[];
  missing_equipment?: string[];
  on_duty_doctors?: string[];
  emergency_hotline?: string;
}

export interface SelectedFacility {
  hospital_id: string;
  hospital_name: string;
  area: string;
  latitude?: number;
  longitude?: number;
  distance_km: number;
  eta_minutes: number;
  ambulances_available: number;
  assigned_ambulance_id?: string;
  emergency_hotline?: string;
  status?: string;
}

export interface ActionPlan {
  distribution_plan: DistributionPlan[];
  screened_facilities?: ScreenedFacility[];
  alerted_facilities?: ScreenedFacility[];
  selected_facility?: SelectedFacility;
  required_equipment?: string[];
  eta_minutes?: number;
  reasoning?: string[];
}

export interface PipelineNode {
  id: string;
  step: number;
  title: string;
  status: "completed" | "in_progress" | "pending";
  timestamp?: string | null;
  headline: string;
  details?: Record<string, any>;
}

export interface IncidentAcceptance {
  incident_id: string;
  responder_id: string;
  responder_name: string;
  responder_role?: string;
  ambulance_id?: string;
  eta_minutes?: number;
  status: string;
  notes?: string;
  accepted_at: string;
}

export interface CoLocationVerification {
  anomaly_detected: boolean;
  cell_tower_collision: boolean;
  bssid_collision: boolean;
  micro_distance_collision: boolean;
  min_inter_device_distance_meters?: number;
  matching_cell_towers?: string[];
  matching_bssids?: string[];
  reason?: string;
}

export interface SpatialDispersionVerification {
  dispersion_score: number;
  angular_spread_degrees: number;
  quadrants_covered: number;
  quadrant_names?: string[];
  all_within_los: boolean;
  status: "single_reporter" | "suspicious_collinear" | "verified_multi_angle" | "moderate_dispersion";
  description: string;
  bearings?: number[];
  distances_meters?: number[];
}

export interface IncidentVerification {
  is_anomaly: boolean;
  verification_status: "verified" | "suspicious" | "unverified" | "moderate";
  total_reports_analyzed: number;
  effective_cluster_size: number;
  co_location: CoLocationVerification;
  spatial_dispersion: SpatialDispersionVerification;
  confidence_evaluation?: {
    raw_confidence: number;
    final_confidence: number;
    penalty_applied: boolean;
    reason?: string;
  };
}

export interface Incident {
  incident_id: string;
  responder_role: string;
  victim_count: number;
  confidence: number;
  urgency: Urgency;
  is_emergency?: boolean;
  intent?: string;
  created_at?: string;
  latitude?: number;
  longitude?: number;
  gps_verified?: boolean;
  accuracy_meters?: number;
  need_type?: string;
  location_text?: string;
  reasoning?: string[];
  action_plan?: ActionPlan;
  pipeline_nodes?: PipelineNode[];
  screened_facilities?: ScreenedFacility[];
  selected_facility?: SelectedFacility;
  status?: string;
  victim_reply?: string;
  acceptance?: IncidentAcceptance;
  verification?: IncidentVerification;
  media_url?: string;
  media_type?: "image" | "video";
}

export interface WebSocketMessage {
  type: "incident_update" | "incident_accepted" | string;
  payload: any;
}