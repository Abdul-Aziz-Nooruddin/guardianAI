import { useState, useEffect, useCallback } from "react";
import {
  fetchHospitals,
  updateHospital,
  type HospitalTelemetry,
  fetchIncidents,
  acceptIncident,
  logResponderDecision,
} from "../shared/api/client";
import { useWebSocket } from "../shared/hooks/useWebSocket";
import type { Incident } from "../shared/types";
import ThemeToggle from "../shared/components/ThemeToggle";
import LanguageSelector from "../shared/components/LanguageSelector";
import SlideDownToast from "../shared/components/SlideDownToast";
import { useLanguage } from "../shared/context/LanguageContext";
import IncidentMiniMap from "../responder-dashboard/panels/IncidentMiniMap";
import {
  Building2,
  Ambulance,
  Bed,
  Activity,
  MapPin,
  Check,
  Radio,
  ArrowLeft,
  ShieldAlert,
  Plus,
  Minus,
  CheckCircle2,
  Lock,
  UserCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
  Clock,
} from "lucide-react";

function calculateAutoHospitalStatus(h: {
  available_beds: number;
  total_beds: number;
  icu_available: number;
  icu_total: number;
  ambulances_available: number;
  doctors_available?: number;
}): { status: "operational" | "surging" | "diverting" | "critical"; reason: string } {
  const beds = h.available_beds ?? 0;
  const icu = h.icu_available ?? 0;
  const amb = h.ambulances_available ?? 0;
  const docs = h.doctors_available ?? 3;
  const icuTotal = h.icu_total || 20;
  const icuOccupiedPct = Math.round((1 - icu / icuTotal) * 100);

  // 1. Code Black (critical): 0 beds AND 0 ICU, OR 0 doctors
  if ((beds === 0 && icu === 0) || docs === 0) {
    return {
      status: "critical",
      reason:
        docs === 0
          ? "Auto-Trigger: 0 emergency physicians on duty. Zero intake capacity (Code Black)."
          : "Auto-Trigger: 100% full capacity (0 ward beds, 0 ICU beds available). Zero intake capacity (Code Black).",
    };
  }

  // 2. Diverting: ICU exhausted (0), ward beds <= 2, or only 1 doctor
  if (icu === 0 || beds <= 2 || docs <= 1) {
    let reason = `Auto-Trigger: Critical ward bed shortage (${beds} beds left). Diverting minor cases to other facilities.`;
    if (docs <= 1) {
      reason = "Auto-Trigger: Severe medical staffing shortage (only 1 ER physician on duty). Diverting non-critical cases.";
    } else if (icu === 0) {
      reason = "Auto-Trigger: 0 ICU beds remaining. Non-critical emergency cases diverted.";
    }
    return {
      status: "diverting",
      reason,
    };
  }

  // 3. Surge Priority: 0 ambulances on standby, or ICU occupancy >= 75%, or beds <= 5, or docs <= 2
  if (amb === 0 || icuOccupiedPct >= 75 || beds <= 5 || docs <= 2) {
    const causes: string[] = [];
    if (amb === 0) causes.push("0 ambulances on standby");
    if (docs <= 2) causes.push(`limited ER physician staffing (${docs} on duty)`);
    if (icuOccupiedPct >= 75) causes.push(`ICU capacity strained (${icuOccupiedPct}% occupied)`);
    if (beds <= 5) causes.push(`only ${beds} beds remaining`);
    return {
      status: "surging",
      reason: `Auto-Trigger: ${causes.join(", ")}. Intake reserved strictly for critical trauma.`,
    };
  }

  // 4. Operational: Normal healthy intake
  return {
    status: "operational",
    reason: `Auto-Trigger: Healthy readiness (${beds} ward beds, ${icu} ICU beds, ${docs} doctors, ${amb} ambulances ready).`,
  };
}

const DEFAULT_HOSPITALS: HospitalTelemetry[] = [
  {
    id: "h_c",
    name: "Apollo Emergency & Trauma Center",
    area: "Banjara Hills",
    latitude: 17.4262,
    longitude: 78.4116,
    total_beds: 30,
    available_beds: 18,
    icu_total: 30,
    icu_available: 12,
    specialists: "orthopedic,trauma,neuro,emergency_surgery",
    ambulances_available: 3,
    ambulance_ready: true,
    equipment: ["trauma_unit", "emergency_surgery", "icu_ventilator", "ct_scan", "blood_bank", "advanced_cardiac_life_support"],
    doctors_available: 4,
    on_duty_doctors: ["trauma_surgeon", "anesthesiologist", "orthopedic_surgeon", "emergency_medicine_head"],
    emergency_hotline: "+91-40-2360-7777",
    status: "operational",
  },
  {
    id: "h_a",
    name: "Aster Prime Hospital",
    area: "Ameerpet",
    latitude: 17.4374,
    longitude: 78.4482,
    total_beds: 20,
    available_beds: 2,
    icu_total: 20,
    icu_available: 2,
    specialists: "cardiac,general",
    ambulances_available: 0,
    ambulance_ready: false,
    equipment: ["general_icu", "cardiac_monitor", "defibrillator", "ultrasound"],
    doctors_available: 2,
    on_duty_doctors: ["general_physician", "cardiologist"],
    emergency_hotline: "+91-40-2374-1001",
    status: "operational",
  },
  {
    id: "h_b",
    name: "Sunshine Multi-Speciality",
    area: "Secunderabad",
    latitude: 17.4399,
    longitude: 78.4983,
    total_beds: 28,
    available_beds: 11,
    icu_total: 28,
    icu_available: 18,
    specialists: "general,pediatric,cardiac",
    ambulances_available: 1,
    ambulance_ready: true,
    equipment: ["general_icu", "nicu", "ventilators", "pathology_lab"],
    doctors_available: 2,
    on_duty_doctors: ["pediatrician", "general_surgeon"],
    emergency_hotline: "+91-40-2780-2002",
    status: "operational",
  },
  {
    id: "h_d",
    name: "KIMS Emergency Care",
    area: "Kukatpally",
    latitude: 17.4849,
    longitude: 78.4108,
    total_beds: 24,
    available_beds: 6,
    icu_total: 24,
    icu_available: 8,
    specialists: "general,orthopedic",
    ambulances_available: 2,
    ambulance_ready: true,
    equipment: ["general_icu", "x_ray", "trauma_triage", "oxygen_bank"],
    doctors_available: 2,
    on_duty_doctors: ["orthopedic_surgeon", "er_resident"],
    emergency_hotline: "+91-40-2772-5000",
    status: "operational",
  },
];

export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface DeficiencyReason {
  type: "ambulance" | "proximity" | "beds" | "icu" | "doctors" | "triage_status" | "accepted_elsewhere";
  title: string;
  description: string;
  badge: string;
  remedyAction: string;
}

export interface HospitalIncidentEvaluation {
  isEligible: boolean;
  isDesignated: boolean;
  assignedHospitalName: string;
  assignedHospitalId: string;
  assignedDistanceKm: number;
  distanceKm: number;
  etaMinutes: number;
  victimLat: number;
  victimLng: number;
  locationText: string;
  victimCount: number;
  deficiencies: DeficiencyReason[];
}

export function evaluateHospitalEligibility(
  hospital: HospitalTelemetry,
  inc: Incident,
  allHospitals: HospitalTelemetry[]
): HospitalIncidentEvaluation {
  const victimLat = inc.latitude ?? inc.selected_facility?.latitude ?? 17.4374;
  const victimLng = inc.longitude ?? inc.selected_facility?.longitude ?? 78.4482;
  const locationText = inc.location_text || "Hyderabad Emergency Zone";
  const victimCount = Math.max(1, inc.victim_count || 1);
  const urgency = inc.urgency || "high";
  const needType = (inc.need_type || inc.intent || "medical").toLowerCase();

  // If incident was accepted by a responder/hospital
  if (inc.acceptance?.responder_id) {
    const assignedHosp = allHospitals.find((h) => h.id === inc.acceptance?.responder_id);
    const isThisHosp = inc.acceptance.responder_id === hospital.id;
    const dist = calculateHaversineKm(victimLat, victimLng, hospital.latitude, hospital.longitude);
    const assignedDist = assignedHosp ? calculateHaversineKm(victimLat, victimLng, assignedHosp.latitude, assignedHosp.longitude) : dist;

    if (isThisHosp) {
      return {
        isEligible: true,
        isDesignated: true,
        assignedHospitalName: hospital.name,
        assignedHospitalId: hospital.id,
        assignedDistanceKm: dist,
        distanceKm: dist,
        etaMinutes: Math.max(3, Math.round(3.0 + dist * 1.5)),
        victimLat,
        victimLng,
        locationText,
        victimCount,
        deficiencies: [],
      };
    } else {
      return {
        isEligible: false,
        isDesignated: false,
        assignedHospitalName: assignedHosp?.name || inc.acceptance.responder_name,
        assignedHospitalId: inc.acceptance.responder_id,
        assignedDistanceKm: assignedDist,
        distanceKm: dist,
        etaMinutes: Math.max(3, Math.round(3.0 + dist * 1.5)),
        victimLat,
        victimLng,
        locationText,
        victimCount,
        deficiencies: [
          {
            type: "accepted_elsewhere",
            title: `Casualty Dispatched to ${assignedHosp?.name || inc.acceptance.responder_name}`,
            description: `Intake authorization already granted by ${assignedHosp?.name || inc.acceptance.responder_name}. Unit ${inc.acceptance.ambulance_id || "AMB-CAD"} currently en route.`,
            badge: "Dispatched to Other ER",
            remedyAction: "No action required. Monitoring for secondary mutual aid.",
          },
        ],
      };
    }
  }

  // Rank candidate hospitals by distance & operational readiness
  const candidateHospitals = allHospitals.map((h) => {
    const dist = calculateHaversineKm(victimLat, victimLng, h.latitude, h.longitude);
    const ambs = h.ambulances_available ?? 0;
    const beds = h.available_beds ?? 0;
    const isOperational = h.status !== "diverting" && h.status !== "critical";
    const isQualified = ambs > 0 && beds >= victimCount && isOperational;

    // Check explicit allocation in distribution_plan or selected_facility
    const inPlan = inc.action_plan?.distribution_plan?.some(
      (p: any) => p.hospital_id === h.id && (p.victims_assigned ?? 0) > 0
    );
    const isSelected = inc.selected_facility?.hospital_id === h.id;

    let score = isQualified ? (100 - dist * 4) : (20 - dist * 2);
    if (inPlan || isSelected) score += 60;

    return {
      hospital: h,
      distanceKm: dist,
      isQualified,
      score,
    };
  });

  candidateHospitals.sort((a, b) => b.score - a.score);
  const primaryCandidate = candidateHospitals[0] || {
    hospital: allHospitals[0] || hospital,
    distanceKm: 2.5,
  };

  const assignedHospitalName = primaryCandidate.hospital.name;
  const assignedHospitalId = primaryCandidate.hospital.id;
  const assignedDistanceKm = primaryCandidate.distanceKm;

  const thisDist = calculateHaversineKm(victimLat, victimLng, hospital.latitude, hospital.longitude);
  const etaMinutes = Math.max(3, Math.round(3.0 + thisDist * 1.5));

  // Determine deficiencies for THIS hospital
  const deficiencies: DeficiencyReason[] = [];
  const ambs = hospital.ambulances_available ?? 0;
  const beds = hospital.available_beds ?? 0;
  const icu = hospital.icu_available ?? 0;
  const docs = hospital.doctors_available ?? 2;
  const status = hospital.status ?? "operational";

  // 1. Ambulance readiness
  if (ambs < 1) {
    deficiencies.push({
      type: "ambulance",
      title: "0 Free Standby Ambulances",
      description: `${hospital.name} currently has 0 available ambulances. At least 1 active standby ambulance is required to dispatch to the casualty scene.`,
      badge: "0 Ambulances Ready",
      remedyAction: "Increment free ambulances in the Ambulance Fleet Availability controller above.",
    });
  }

  // 2. Proximity & Nearest Facility
  const isThisPrimary = assignedHospitalId === hospital.id;
  if (!isThisPrimary) {
    deficiencies.push({
      type: "proximity",
      title: `Not the Nearest Eligible Facility (${assignedHospitalName})`,
      description: `${hospital.name} is ${thisDist} km away (~${etaMinutes} min). CAD triage prioritized ${assignedHospitalName} (${assignedDistanceKm} km away) to minimize casualty transit time.`,
      badge: `${thisDist} km vs ${assignedDistanceKm} km`,
      remedyAction: "Mutual-aid authorization available if primary hospital diverts.",
    });
  }

  // 3. Ward bed capacity
  if (beds < victimCount) {
    deficiencies.push({
      type: "beds",
      title: "Insufficient General / Trauma Ward Beds",
      description: `Facility has only ${beds} ward beds available, but incident requires admission capacity for ${victimCount} casualty(ies).`,
      badge: `${beds}/${victimCount} Beds Available`,
      remedyAction: "Discharge stabilized ward patients or expand intake capacity.",
    });
  }

  // 4. ICU capacity for high urgency
  if ((urgency === "critical" || needType.includes("trauma") || needType.includes("burn") || needType.includes("accident")) && icu === 0) {
    deficiencies.push({
      type: "icu",
      title: "0 ICU Beds Available (100% Saturation)",
      description: "High-acuity trauma and burn casualties require immediate ICU readiness. ICU is currently at 100% capacity.",
      badge: "0 ICU Beds",
      remedyAction: "Step down stabilized ICU patients or expand critical care capacity.",
    });
  }

  // 5. Triage mode
  if (status === "diverting") {
    deficiencies.push({
      type: "triage_status",
      title: "Facility Intake Mode Set to Diverting",
      description: "Hospital intake mode is currently set to 'Diverting'. Non-critical trauma is automatically rerouted to neighboring hospitals.",
      badge: "Diverting Active",
      remedyAction: "Switch intake mode to Operational in the Facility Intake control panel.",
    });
  } else if (status === "critical") {
    deficiencies.push({
      type: "triage_status",
      title: "Code Black (Zero Intake Capacity)",
      description: "Facility is locked in Code Black (Zero Intake Capacity). All emergency admissions are prohibited.",
      badge: "Code Black Active",
      remedyAction: "Alleviate ER congestion and switch out of Code Black.",
    });
  }

  // 6. ER Physician Staffing
  if (docs < 2) {
    deficiencies.push({
      type: "doctors",
      title: "Emergency Physician Staffing Shortage",
      description: `Only ${docs} doctor on duty. Minimum 2 emergency physicians required for acute casualty intake.`,
      badge: `${docs} Doctor(s) on Duty`,
      remedyAction: "Call in on-duty emergency physicians or trauma specialists.",
    });
  }

  const isEligible = deficiencies.length === 0;
  const isDesignated = isThisPrimary && ambs >= 1 && beds >= victimCount && status !== "diverting" && status !== "critical";

  return {
    isEligible,
    isDesignated,
    assignedHospitalName,
    assignedHospitalId,
    assignedDistanceKm,
    distanceKm: thisDist,
    etaMinutes,
    victimLat,
    victimLng,
    locationText,
    victimCount,
    deficiencies,
  };
}

interface HospitalPortalProps {
  initialHospitalId?: string;
  onBackToRoles?: () => void;
  onSwitchToResponder?: () => void;
  onSwitchToCitizen?: () => void;
}

export default function HospitalPortal({
  initialHospitalId = "h_c",
  onBackToRoles,
  onSwitchToResponder,
  onSwitchToCitizen,
}: HospitalPortalProps): React.JSX.Element {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState<HospitalTelemetry[]>(DEFAULT_HOSPITALS);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(initialHospitalId);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isAutoTriage, setIsAutoTriage] = useState<boolean>(true);

  const wsMessage = useWebSocket() as { type?: string; payload?: any } | null;

  const loadData = useCallback(async () => {
    try {
      const [hList, incList] = await Promise.all([
        fetchHospitals().catch(() => DEFAULT_HOSPITALS),
        fetchIncidents().catch(() => []),
      ]);
      const validHospitals = Array.isArray(hList) && hList.length > 0 ? hList : DEFAULT_HOSPITALS;
      setHospitals(validHospitals);
      setIncidents(incList);
      if (validHospitals.length > 0 && !validHospitals.some((h) => h.id === selectedHospitalId)) {
        setSelectedHospitalId(validHospitals[0].id);
      }
    } catch (e) {
      console.error("Failed to load hospital data", e);
      setHospitals(DEFAULT_HOSPITALS);
    }
  }, [selectedHospitalId]);

  // Load initial hospitals & incidents
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to WebSocket events in real time
  useEffect(() => {
    if (wsMessage?.type === "hospital_update" && wsMessage.payload) {
      const updated = wsMessage.payload as HospitalTelemetry;
      setHospitals((prev) =>
        prev.map((h) => (h.id === updated.id ? { ...h, ...updated } : h))
      );
      if (updated.id === selectedHospitalId) {
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } else if (wsMessage?.type === "incident_update" && wsMessage.payload) {
      const newInc = wsMessage.payload as Incident;
      setIncidents((prev) => {
        const idx = prev.findIndex((i) => i.incident_id === newInc.incident_id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = newInc;
          return copy;
        }
        return [newInc, ...prev];
      });
    } else if (wsMessage?.type === "incident_accepted" && wsMessage.payload) {
      const acc = wsMessage.payload;
      setIncidents((prev) =>
        prev.map((i) =>
          i.incident_id === acc.incident_id
            ? { ...i, status: "accepted_en_route", acceptance: acc }
            : i
        )
      );
      fetchHospitals()
        .then((hList) => {
          if (Array.isArray(hList) && hList.length > 0) setHospitals(hList);
        })
        .catch(() => {});
    }
  }, [wsMessage, selectedHospitalId]);

  const currentHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [intakeFilter, setIntakeFilter] = useState<"assigned" | "all">("assigned");

  // Helper to determine if an incident routes specifically and eligibly to this hospital
  const isIncidentMatchedToHospital = (
    inc: Incident,
    hospId: string,
    _hospName: string
  ): boolean => {
    const targetHosp = hospitals.find((h) => h.id === hospId);
    if (!targetHosp) return false;
    const evalResult = evaluateHospitalEligibility(targetHosp, inc, hospitals);
    return evalResult.isDesignated;
  };

  const handleApproveIntake = async (inc: Incident) => {
    if (!currentHospital) return;
    setApprovingId(inc.incident_id);

    const vehicleId =
      inc.selected_facility?.assigned_ambulance_id ||
      inc.action_plan?.selected_facility?.assigned_ambulance_id ||
      `AMB-${currentHospital.id.replace("h_", "").toUpperCase()}104`;
    const etaMinutes =
      inc.selected_facility?.eta_minutes ||
      inc.action_plan?.eta_minutes ||
      6;

    try {
      await acceptIncident({
        incident_id: inc.incident_id,
        responder_id: currentHospital.id,
        responder_name: currentHospital.name,
        responder_role: "medical",
        ambulance_id: vehicleId,
        eta_minutes: etaMinutes,
        notes: `Clinical intake approved by ${currentHospital.name} ER triage. Trauma bay prepared and ${vehicleId} dispatched with emergency medical team.`,
      });

      try {
        await logResponderDecision(inc.incident_id, "approved");
      } catch (e) {
        console.warn("Decision logging warning:", e);
      }

      // Optimistically decrement local hospital capacity immediately
      setHospitals((prev) =>
        prev.map((h) =>
          h.id === currentHospital.id
            ? {
                ...h,
                available_beds: Math.max(0, (h.available_beds ?? 1) - (inc.victim_count || 1)),
                ambulances_available: Math.max(0, (h.ambulances_available ?? 1) - 1),
              }
            : h
        )
      );

      // Mark incident as accepted locally
      const acceptanceRecord = {
        incident_id: inc.incident_id,
        responder_id: currentHospital.id,
        responder_name: currentHospital.name,
        responder_role: "medical",
        ambulance_id: vehicleId,
        eta_minutes: etaMinutes,
        status: "accepted_en_route",
        notes: `Clinical intake approved by ${currentHospital.name} ER triage.`,
        accepted_at: new Date().toISOString(),
      };

      setIncidents((prev) =>
        prev.map((i) =>
          i.incident_id === inc.incident_id
            ? {
                ...i,
                status: "accepted_en_route",
                acceptance: acceptanceRecord,
              }
            : i
        )
      );

      setApprovalNotice(
        `Intake Approved! ${currentHospital.name} dispatched Unit ${vehicleId} for Incident #${inc.incident_id.replace(/^inc_/, "").slice(-6).toUpperCase()}. Trauma bay reserved.`
      );
      setTimeout(() => setApprovalNotice(null), 6500);
    } catch (err) {
      console.error("Failed to approve hospital intake", err);
      alert("Failed to confirm intake with dispatch network. Please try again.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleUpdateTelemetry = async (
    updates: Partial<HospitalTelemetry>,
    label?: string,
    isManualStatusOverride: boolean = false
  ) => {
    if (!currentHospital) return;
    setIsUpdating(true);

    const merged = { ...currentHospital, ...updates };
    let finalUpdates = { ...updates };

    // Automatically recalculate status according to beds, ICU, and ambulances unless manual override is explicitly used
    if (isAutoTriage && !isManualStatusOverride) {
      const auto = calculateAutoHospitalStatus(merged);
      finalUpdates.status = auto.status;
      finalUpdates.auto_status = true;
      finalUpdates.auto_status_reason = auto.reason;
    }

    try {
      const res = await updateHospital(currentHospital.id, finalUpdates);
      // Immediately reflect locally
      setHospitals((prev) =>
        prev.map((h) => (h.id === currentHospital.id ? { ...h, ...res.hospital } : h))
      );
      setLastSyncTime(new Date().toLocaleTimeString());
      setSyncNotice(
        label ||
          `Telemetry synchronized: ${res.hospital.name} is now ${res.hospital.status.toUpperCase()}`
      );
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (err) {
      console.error("Failed to update hospital telemetry", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // All emergency distress reports requiring casualty intake across the city
  const allMedicalIncidents = incidents.filter(
    (inc) =>
      inc.responder_role === "medical" ||
      inc.need_type === "medical" ||
      inc.need_type === "road_accident" ||
      inc.need_type === "accident" ||
      inc.need_type === "burns" ||
      inc.need_type === "trauma" ||
      inc.need_type === "fire" ||
      inc.intent === "fire" ||
      (inc.victim_count && inc.victim_count > 0) ||
      !!inc.action_plan?.distribution_plan?.length
  );

  // All pending requests from persons requiring hospital clinical authorization
  const allPendingMedical = allMedicalIncidents.filter(
    (inc) => inc.status !== "accepted_en_route" && !inc.acceptance
  );

  // Incidents specifically designated and eligible to this active hospital
  const incomingDispatches = incidents.filter((inc) => {
    return isIncidentMatchedToHospital(inc, currentHospital?.id || "", currentHospital?.name || "");
  });

  const hospitalSpecificPending = incomingDispatches.filter(
    (inc) => inc.status !== "accepted_en_route" && !inc.acceptance
  );

  // Default to assigned so each hospital only receives its allocated casualties by default!
  const displayedPendingIntakes =
    intakeFilter === "assigned" ? hospitalSpecificPending : allPendingMedical;

  const displayedDispatches =
    intakeFilter === "assigned" ? incomingDispatches : allMedicalIncidents;

  if (!currentHospital) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
        Loading Hospital Telemetry...
      </div>
    );
  }

  const occupiedIcuPct = Math.round(
    (1 - (currentHospital.icu_available ?? 0) / (currentHospital.icu_total || 1)) * 100
  );
  const occupiedBedPct = Math.round(
    (1 - (currentHospital.available_beds ?? 0) / (currentHospital.total_beds || 1)) * 100
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Institutional Top Bar */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-card)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {onBackToRoles && (
            <button
              onClick={onBackToRoles}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} /> {t("nav.back")}
            </button>
          )}

          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "var(--accent)",
              color: "var(--accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={16} strokeWidth={2.4} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.2px" }}>
                {t("hospital.title")}
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Radio size={11} className="pulse-dot" /> {t("nav.live_mesh")}
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
              {t("hospital.subtitle")}
            </div>
          </div>
        </div>

        {/* Global Navigation Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onSwitchToResponder && (
            <button
              onClick={onSwitchToResponder}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {t("nav.responder_portal")}
            </button>
          )}

          {onSwitchToCitizen && (
            <button
              onClick={onSwitchToCitizen}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {t("nav.citizen_portal")}
            </button>
          )}

          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* Animated Floating Slide-Down Toast Notification */}
      <SlideDownToast
        message={approvalNotice || syncNotice}
        type={approvalNotice ? "success" : "info"}
        duration={approvalNotice ? 6000 : 3500}
        onClose={() => {
          setSyncNotice(null);
          setApprovalNotice(null);
        }}
      />

      {/* Main Content Layout */}
      <main
        style={{
          flex: 1,
          padding: "20px 24px",
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Hospital Facility Selector Tabs */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t("hospital.select_facility")}
            </span>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
              <Radio size={12} color="#10b981" /> {t("hospital.last_sync")} <strong style={{ color: "var(--text-primary)" }}>{lastSyncTime}</strong>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "10px",
            }}
          >
            {hospitals.map((h) => {
              const isSelected = h.id === selectedHospitalId;
              const amb = h.ambulances_available ?? 0;
              const pendingCountForHosp = incidents.filter(
                (inc) =>
                  isIncidentMatchedToHospital(inc, h.id, h.name) &&
                  inc.status !== "accepted_en_route" &&
                  !inc.acceptance
              ).length;

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospitalId(h.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: isSelected ? "var(--bg-muted)" : "var(--bg-card)",
                    border: isSelected ? "1.5px solid var(--text-primary)" : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {h.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <MapPin size={11} /> {h.area}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {pendingCountForHosp > 0 && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "3px",
                            background: "var(--critical-bg)",
                            color: "var(--critical-text)",
                            border: "1px solid var(--critical-border)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <AlertTriangle size={9} /> {pendingCountForHosp} INTAKE
                        </span>
                      )}
                      {isSelected && (
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "3px",
                            background: "var(--accent)",
                            color: "var(--accent-text)",
                            letterSpacing: "0.03em",
                          }}
                        >
                          {t("hospital.managing")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        color: amb > 0 ? "var(--success-text)" : "var(--critical-text)",
                        background: amb > 0 ? "var(--success-bg)" : "var(--critical-bg)",
                        border: `1px solid ${amb > 0 ? "var(--success-border)" : "var(--critical-border)"}`,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      className="tabular-nums"
                    >
                      <Ambulance size={11} /> {amb} Ready
                    </span>
                    <span className="tabular-nums font-mono" style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>
                      ICU: {h.icu_available}/{h.icu_total}
                    </span>
                    <span className="tabular-nums font-mono" style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>
                      Beds: {h.available_beds}/{h.total_beds}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Intake Approval Notice */}
        {approvalNotice && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "8px",
              background: "var(--success-bg)",
              border: "1px solid var(--success-border)",
              color: "var(--success-text)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            <div style={{ flex: 1 }}>{approvalNotice}</div>
          </div>
        )}

        {/* Prominent Emergency Casualty Intake & Dispatch Alert Banners: SHOW AS MANY AS PERSONS REQUEST! */}
        {displayedPendingIntakes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Header: Overview of all requesting persons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                padding: "2px 2px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "var(--critical-bg)",
                    border: "1px solid var(--critical-border)",
                    color: "var(--critical)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={15} />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Live Emergency Distress Requests
                    </span>
                    <span className="badge critical tabular-nums" style={{ fontSize: "10.5px" }}>
                      {displayedPendingIntakes.length} {displayedPendingIntakes.length === 1 ? "Person" : "Persons"} Requesting
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                    Showing live citizen distress transmissions requiring hospital clinical authorization & ambulance release
                  </div>
                </div>
              </div>

              {/* Scope filter buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setIntakeFilter("assigned")}
                  style={{
                    padding: "5px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "5px",
                    cursor: "pointer",
                    background: intakeFilter === "assigned" ? "var(--accent)" : "var(--bg-muted)",
                    color: intakeFilter === "assigned" ? "var(--accent-text)" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  Assigned to {currentHospital.name} ({hospitalSpecificPending.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIntakeFilter("all")}
                  style={{
                    padding: "5px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "5px",
                    cursor: "pointer",
                    background: intakeFilter === "all" ? "var(--accent)" : "var(--bg-muted)",
                    color: intakeFilter === "all" ? "var(--accent-text)" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  All City Distress Calls ({allPendingMedical.length})
                </button>
              </div>
            </div>

            {/* List of alert cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayedPendingIntakes.map((currentPending, idx) => {
                const evalResult = evaluateHospitalEligibility(currentHospital, currentPending, hospitals);
                const isMatchedToThis = evalResult.isDesignated;
                const assignedFacName = evalResult.assignedHospitalName;
                const assignedDistanceKm = evalResult.assignedDistanceKm;
                const vehicleId =
                  currentPending.acceptance?.ambulance_id ||
                  currentPending.selected_facility?.assigned_ambulance_id ||
                  `AMB-${currentHospital.id.replace("h_", "").toUpperCase()}10${idx + 1}`;
                const etaMinutes = evalResult.etaMinutes;
                const distanceKm = evalResult.distanceKm;
                const requiredEquip =
                  currentPending.action_plan?.required_equipment ||
                  ["trauma_unit", "icu_ventilator"];
                const victimCount = evalResult.victimCount;
                const hasCapacity = (currentHospital.available_beds ?? 0) >= victimCount && (currentHospital.ambulances_available ?? 0) > 0;

                const victimLat = evalResult.victimLat;
                const victimLng = evalResult.victimLng;
                const stationLat = currentHospital.latitude ?? 17.4262;
                const stationLng = currentHospital.longitude ?? 78.4116;
                const isAccepted = currentPending.status === "accepted_en_route" || !!currentPending.acceptance;

                return (
                  <div
                    key={currentPending.incident_id}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderLeft: `4px solid ${isMatchedToThis ? "var(--critical)" : "var(--warning)"}`,
                      borderRadius: "8px",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      boxShadow: "var(--shadow-subtle)",
                    }}
                  >
                    {/* Header: Urgency, Eligibility Status, and Person info */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "5px",
                            background: isMatchedToThis ? "var(--critical-bg)" : "var(--warning-bg)",
                            border: `1px solid ${isMatchedToThis ? "var(--critical-border)" : "var(--warning-border)"}`,
                            color: isMatchedToThis ? "var(--critical)" : "var(--warning)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <AlertTriangle size={15} />
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>
                              EMERGENCY CASUALTY INTAKE ALERT
                            </span>
                            <span className="badge critical" style={{ fontSize: "9.5px" }}>
                              {(currentPending.urgency || "CRITICAL").toUpperCase()} PRIORITY
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: isMatchedToThis ? "var(--success-bg)" : "var(--warning-bg)",
                                border: `1px solid ${isMatchedToThis ? "var(--success-border)" : "var(--warning-border)"}`,
                                color: isMatchedToThis ? "var(--success-text)" : "var(--warning-text)",
                              }}
                            >
                              {isMatchedToThis ? "✅ Designated Facility for Intake" : `🔒 Ineligible • Handled by ${assignedFacName}`}
                            </span>
                          </div>

                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {isMatchedToThis ? (
                              <>Casualties routed to <strong style={{ color: "var(--text-primary)" }}>{currentHospital.name}</strong> • Incident INC-{currentPending.incident_id.replace(/^inc_/, "").slice(-8).toUpperCase()}</>
                            ) : (
                              <>Distress Origin: <strong style={{ color: "var(--text-primary)" }}>{evalResult.locationText}</strong> ({distanceKm} km away) • Prioritized ER: <strong style={{ color: "var(--text-primary)" }}>{assignedFacName}</strong> ({assignedDistanceKm} km)</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: isMatchedToThis ? "var(--critical)" : "var(--warning)" }} className="tabular-nums font-mono">
                          {victimCount} {victimCount === 1 ? "Victim" : "Victims"}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {isMatchedToThis ? "allocated to this ER" : `routed to ${assignedFacName}`}
                        </div>
                      </div>
                    </div>

                    {/* What This Hospital Lacks in Service (Visible when Ineligible) */}
                    {!isMatchedToThis && evalResult.deficiencies.length > 0 && (
                      <div
                        style={{
                          background: "rgba(244, 63, 94, 0.05)",
                          border: "1px solid rgba(244, 63, 94, 0.2)",
                          borderRadius: "6px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", fontWeight: 700, color: "#f43f5e" }}>
                          <AlertTriangle size={14} />
                          <span>Why {currentHospital.name} Cannot Authorize This Request (Service Gap Analysis):</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "8px" }}>
                          {evalResult.deficiencies.map((d, i) => (
                            <div
                              key={i}
                              style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "6px",
                                padding: "8px 10px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>
                                  {d.title}
                                </span>
                                <span
                                  style={{
                                    fontSize: "9.5px",
                                    fontWeight: 600,
                                    padding: "1px 6px",
                                    borderRadius: "3px",
                                    background: "rgba(244, 63, 94, 0.15)",
                                    color: "#f43f5e",
                                  }}
                                >
                                  {d.badge}
                                </span>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "15px" }}>
                                {d.description}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                💡 <strong style={{ color: "var(--text-secondary)" }}>Action to Qualify:</strong> {d.remedyAction}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2-Column Content: Left (Triage Telemetry) & Right (Tactical Mini-Map) */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
                        gap: "14px",
                        alignItems: "stretch",
                      }}
                    >
                      {/* Left: Triage Telemetry Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                          gap: "12px",
                          background: "var(--bg-muted)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "6px",
                          padding: "12px 14px",
                        }}
                      >
                        {/* Sub-col 1: Location & Transit */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                            PATIENT CONDITION & ORIGIN LOCATION
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>
                              {currentPending.intent || currentPending.need_type?.replace(/_/g, " ") || "Emergency Medical Crisis"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <MapPin size={12} color="var(--text-muted)" />
                              <span>Live GPS: ({victimLat.toFixed(4)}, {victimLng.toFixed(4)})</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Clock size={12} color="var(--text-muted)" />
                              <span>Transit: ~{etaMinutes} min ({distanceKm} km from {currentHospital.name})</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Ambulance size={12} color="var(--text-muted)" />
                              <span>Target Hospital: <strong style={{ color: "var(--accent)" }}>{assignedFacName}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Sub-col 2: Clinical Capabilities Match */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                            CASUALTIES & READINESS STATUS
                          </div>
                          <div style={{ fontSize: "12.5px", fontWeight: 800, color: isMatchedToThis ? "var(--critical)" : "var(--warning)" }}>
                            {victimCount} {victimCount === 1 ? "Victim" : "Victims"} ({isMatchedToThis ? "allocated here" : `handled by ${assignedFacName}`})
                          </div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                            Required Clinical Equipment:
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {requiredEquip.map((eq: string) => (
                              <span
                                key={eq}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border-subtle)",
                                  color: "var(--text-primary)",
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {eq.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: "11px", marginTop: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                            <CheckCircle2 size={12} color={hasCapacity ? "var(--success)" : "var(--critical)"} />
                            <span style={{ color: hasCapacity ? "var(--success-text)" : "var(--critical-text)", fontWeight: 500, fontSize: "10.5px" }}>
                              {currentHospital.name}: {currentHospital.available_beds} beds, {currentHospital.icu_available} ICU beds, {currentHospital.ambulances_available} ambulances ready
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Tactical Mini-Map */}
                      <div
                        style={{
                          minHeight: "210px",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span className="status-dot" />
                            <span>Tactical GPS Radar & Route</span>
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "10.5px" }}>
                            ER Bay ➔ Incident Scene
                          </span>
                        </div>

                        <div
                          style={{
                            flex: 1,
                            minHeight: "200px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <IncidentMiniMap
                            victimLat={victimLat}
                            victimLng={victimLng}
                            stationLat={stationLat}
                            stationLng={stationLng}
                            victimLocationText={evalResult.locationText}
                            stationName={currentHospital.name}
                            distanceKm={distanceKm}
                            etaMinutes={etaMinutes}
                            isAccepted={isAccepted}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: ONLY ELIGIBLE HOSPITAL GETS APPROVE BUTTON */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px",
                        paddingTop: "6px",
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {isMatchedToThis
                          ? `Authorizing will reserve an ER trauma bay and deploy ${vehicleId} immediately.`
                          : `Intake authorization restricted to designated facility (${assignedFacName}). Monitoring only.`}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isMatchedToThis ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Mutual aid requested for incident #${currentPending.incident_id.slice(-6)}. Rerouting to secondary medical facility.`);
                              }}
                              className="btn btn-secondary"
                              style={{
                                padding: "7px 12px",
                                fontSize: "11.5px",
                                fontWeight: 500,
                              }}
                            >
                              Divert Intake
                            </button>

                            <button
                              type="button"
                              disabled={approvingId === currentPending.incident_id}
                              onClick={() => handleApproveIntake(currentPending)}
                              className="btn btn-primary"
                              style={{
                                padding: "7px 14px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                gap: "6px",
                              }}
                            >
                              <Check size={13} />
                              {approvingId === currentPending.incident_id
                                ? "Approving Intake..."
                                : "Approve Intake & Dispatch Ambulance"}
                            </button>
                          </>
                        ) : (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "rgba(245, 158, 11, 0.12)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              color: "#f59e0b",
                              fontSize: "11.5px",
                              fontWeight: 600,
                            }}
                          >
                            <Lock size={12} />
                            <span>Approval Locked: Ineligible Facility</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Hospital Facility Operational Control Panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Card 1: Ambulance Fleet Controller (The User's specific highlighted feature!) */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                    background: "var(--bg-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-primary)",
                  }}
                >
                  <Ambulance size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{t("hospital.amb_fleet_title")}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {t("hospital.amb_fleet_sub")}
                  </div>
                </div>
              </div>

              <span
                className={
                  (currentHospital.ambulances_available ?? 0) > 0
                    ? "badge success"
                    : "badge critical"
                }
              >
                {(currentHospital.ambulances_available ?? 0) > 0 ? t("hospital.units_available") : t("hospital.fleet_exhausted")}
              </span>
            </div>

            {/* Big Interactive Counter */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                padding: "16px 0",
                background: "var(--bg-muted)",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Decrement Button */}
              <button
                type="button"
                disabled={isUpdating || (currentHospital.ambulances_available ?? 0) <= 0}
                onClick={() => {
                  const current = currentHospital.ambulances_available ?? 0;
                  const nextVal = Math.max(0, current - 1);
                  handleUpdateTelemetry(
                    { ambulances_available: nextVal },
                    t("notice.amb_updated")
                  );
                }}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: (currentHospital.ambulances_available ?? 0) <= 0 ? "not-allowed" : "pointer",
                  opacity: (currentHospital.ambulances_available ?? 0) <= 0 ? 0.4 : 1,
                  fontSize: "18px",
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                }}
              >
                <Minus size={18} />
              </button>

              {/* Number Display */}
              <div style={{ textAlign: "center" }}>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: "32px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono, monospace)",
                    color: (currentHospital.ambulances_available ?? 0) > 0 ? "var(--success)" : "var(--critical)",
                    lineHeight: 1,
                  }}
                >
                  {currentHospital.ambulances_available ?? 0}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {t("hospital.active_free_amb")}
                </div>
              </div>

              {/* Increment Button */}
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => {
                  const current = currentHospital.ambulances_available ?? 0;
                  const nextVal = current + 1;
                  handleUpdateTelemetry(
                    { ambulances_available: nextVal },
                    t("notice.amb_updated")
                  );
                }}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid #10b981",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                }}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                {t("hospital.quick_set")}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[0, 1, 2, 3, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      handleUpdateTelemetry(
                        { ambulances_available: num },
                        t("notice.amb_updated")
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border:
                        currentHospital.ambulances_available === num
                          ? "1.5px solid #10b981"
                          : "1px solid var(--border-subtle)",
                      background:
                        currentHospital.ambulances_available === num
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(255, 255, 255, 0.04)",
                      color:
                        currentHospital.ambulances_available === num ? "#10b981" : "var(--text-primary)",
                      cursor: "pointer",
                    }}
                  >
                    {num === 0 ? t("hospital.none") : num === 3 ? `3 (${t("hospital.free")})` : num}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                fontSize: "11px",
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                padding: "8px 10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--text-secondary)",
              }}
            >
              <Zap size={13} color="var(--text-primary)" />
              <span>
                {t("hospital.amb_hint")}
              </span>
            </div>
          </div>

          {/* Card 2: Bed Capacity & Critical ICU Controller */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "5px",
                  background: "var(--bg-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-primary)",
                }}
              >
                <Bed size={16} />
              </div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{t("hospital.beds_icu_title")}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {t("hospital.beds_icu_sub")}
                </div>
              </div>
            </div>

            {/* ICU Available Controller */}
            <div
              style={{
                background: "var(--bg-muted)",
                padding: "12px 14px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700 }}>{t("hospital.available_icu")}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Total ICU beds: {currentHospital.icu_total}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = currentHospital.icu_available ?? 0;
                      handleUpdateTelemetry({ icu_available: Math.max(0, cur - 1) }, t("notice.icu_updated"));
                    }}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono, monospace)",
                      minWidth: "32px",
                      textAlign: "center",
                    }}
                  >
                    {currentHospital.icu_available}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const cur = currentHospital.icu_available ?? 0;
                      handleUpdateTelemetry(
                        { icu_available: Math.min(currentHospital.icu_total, cur + 1) },
                        t("notice.icu_updated")
                      );
                    }}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>
                  <span>ICU Occupancy</span>
                  <span>{occupiedIcuPct}% Occupied</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${occupiedIcuPct}%`,
                      height: "100%",
                      background: occupiedIcuPct > 85 ? "#ef4444" : occupiedIcuPct > 60 ? "#f59e0b" : "#10b981",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* General Available Beds Controller */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.15)",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700 }}>General / Trauma Beds</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Total Ward beds: {currentHospital.total_beds}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = currentHospital.available_beds ?? 0;
                      handleUpdateTelemetry({ available_beds: Math.max(0, cur - 1) }, t("notice.bed_updated"));
                    }}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono, monospace)",
                      minWidth: "32px",
                      textAlign: "center",
                    }}
                  >
                    {currentHospital.available_beds}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const cur = currentHospital.available_beds ?? 0;
                      handleUpdateTelemetry(
                        { available_beds: Math.min(currentHospital.total_beds, cur + 1) },
                        t("notice.bed_updated")
                      );
                    }}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>
                  <span>Ward Occupancy</span>
                  <span>{occupiedBedPct}% Occupied</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${occupiedBedPct}%`,
                      height: "100%",
                      background: occupiedBedPct > 85 ? "#ef4444" : occupiedBedPct > 60 ? "#f59e0b" : "#38bdf8",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Doctors / Trauma Specialists on Duty Controller */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.15)",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                    <UserCheck size={14} style={{ color: "#a855f7" }} /> On-Duty ER Doctors
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Trauma surgeons & emergency physicians
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={isUpdating || (currentHospital.doctors_available ?? currentHospital.on_duty_doctors?.length ?? 3) <= 0}
                    onClick={() => {
                      const cur = currentHospital.doctors_available ?? currentHospital.on_duty_doctors?.length ?? 3;
                      const nextVal = Math.max(0, cur - 1);
                      handleUpdateTelemetry({ doctors_available: nextVal }, `Physician staffing updated to ${nextVal} on duty.`);
                    }}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: (currentHospital.doctors_available ?? currentHospital.on_duty_doctors?.length ?? 3) <= 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: (currentHospital.doctors_available ?? currentHospital.on_duty_doctors?.length ?? 3) <= 0 ? 0.4 : 1,
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono, monospace)",
                      minWidth: "32px",
                      textAlign: "center",
                      color: (currentHospital.doctors_available ?? currentHospital.on_duty_doctors?.length ?? 3) === 0 ? "#ef4444" : "#a855f7",
                    }}
                  >
                    {currentHospital.doctors_available ?? currentHospital.on_duty_doctors?.length ?? 3}
                  </span>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      const cur = currentHospital.doctors_available ?? currentHospital.on_duty_doctors?.length ?? 3;
                      const nextVal = cur + 1;
                      handleUpdateTelemetry({ doctors_available: nextVal }, `Physician staffing updated to ${nextVal} on duty.`);
                    }}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Doctors tag list */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                {(currentHospital.on_duty_doctors || ["trauma_surgeon", "er_resident"]).map((doc) => (
                  <span
                    key={doc}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(168, 85, 247, 0.12)",
                      color: "#c084fc",
                      textTransform: "capitalize",
                    }}
                  >
                    {doc.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Facility Emergency Intake Status */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "14px",
              border: "1px solid var(--border-subtle)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f59e0b",
                  }}
                >
                  <Activity size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>Facility Intake & Triage Mode</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Dynamic triage broadcast to CAD & Responders
                  </div>
                </div>
              </div>

              {/* Auto / Manual Mode Badge / Button */}
              {isAutoTriage ? (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "20px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    color: "#10b981",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    letterSpacing: "0.2px",
                  }}
                >
                  <Zap size={11} className="pulse-dot" /> AUTO SENSING
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoTriage(true);
                    handleUpdateTelemetry({ auto_status: true }, "Re-enabled AI Auto-Triage mode.");
                  }}
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    color: "#f59e0b",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                  title="Click to resume automatic triage based on real-time beds, ambulances & doctors"
                >
                  <RefreshCw size={11} /> RE-ENABLE AUTO
                </button>
              )}
            </div>

            {/* AI Auto-Trigger Reasoning Callout */}
            <div
              style={{
                background: isAutoTriage ? "rgba(2, 132, 199, 0.08)" : "rgba(245, 158, 11, 0.08)",
                border: isAutoTriage ? "1px solid rgba(2, 132, 199, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "10px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: isAutoTriage ? "#38bdf8" : "#f59e0b",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {isAutoTriage ? <Zap size={13} /> : <Lock size={13} />}
                  {isAutoTriage ? "Active Auto-Triage Decision" : "Manual Status Override"}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {isAutoTriage ? "Reacts live to Beds, ICU, Docs, Ambs" : "Click Re-enable to sync"}
                </span>
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-primary)", lineHeight: 1.4 }}>
                {currentHospital.auto_status_reason || calculateAutoHospitalStatus(currentHospital).reason}
              </div>
            </div>

            {/* 4 Mode Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                {
                  id: "operational",
                  label: "Operational",
                  sub: "Normal intake",
                  color: "#10b981",
                  bg: "rgba(16, 185, 129, 0.12)",
                },
                {
                  id: "surging",
                  label: "Surge Priority",
                  sub: "Critical trauma only",
                  color: "#f59e0b",
                  bg: "rgba(245, 158, 11, 0.12)",
                },
                {
                  id: "diverting",
                  label: "Diverting",
                  sub: "Reroute minor cases",
                  color: "#ef4444",
                  bg: "rgba(239, 68, 68, 0.12)",
                },
                {
                  id: "critical",
                  label: "Code Black",
                  sub: "Zero intake capacity",
                  color: "#a855f7",
                  bg: "rgba(168, 85, 247, 0.12)",
                },
              ].map((opt) => {
                const isActive = (currentHospital.status || "operational").toLowerCase() === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setIsAutoTriage(false);
                      handleUpdateTelemetry(
                        { status: opt.id },
                        `Hospital operational status manually locked to ${opt.label}.`,
                        true
                      );
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: isActive ? `1.5px solid ${opt.color}` : "1px solid var(--border-subtle)",
                      background: isActive ? opt.bg : "rgba(255, 255, 255, 0.03)",
                      color: isActive ? opt.color : "var(--text-primary)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700 }}>{opt.label}</div>
                      {isActive && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 800,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: isAutoTriage ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)",
                            color: isAutoTriage ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {isAutoTriage ? "⚡ AUTO" : "🔒 LOCK"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Emergency Hotline & Clinical Staff Details */}
            <div
              style={{
                marginTop: "auto",
                background: "rgba(0, 0, 0, 0.15)",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "11px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Direct CAD Hotline:</span>
                <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono, monospace)" }}>
                  {currentHospital.emergency_hotline || "+91-40-2360-7777"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Clinical Specialists:</span>
                <span style={{ color: "var(--text-primary)", textAlign: "right" }}>
                  {currentHospital.specialists || "Trauma, Emergency Surgery"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Incoming Emergency Dispatches Routed to this Hospital by Guardian-AI */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "6px",
                  background: "var(--critical-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--critical)",
                  border: "1px solid var(--critical-border)",
                }}
              >
                <ShieldAlert size={16} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {intakeFilter === "assigned"
                    ? `Designated Casualty Influx: ${currentHospital.name}`
                    : "City-Wide Emergency Casualty Dispatches"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {intakeFilter === "assigned"
                    ? `Live casualties designated to ${currentHospital.name} by Guardian-AI Resource Finder`
                    : `Active network casualties monitored across Hyderabad Emergency Operations`}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: displayedDispatches.length > 0 ? "var(--critical-bg)" : "var(--success-bg)",
                  color: displayedDispatches.length > 0 ? "var(--critical-text)" : "var(--success-text)",
                  border: `1px solid ${displayedDispatches.length > 0 ? "var(--critical-border)" : "var(--success-border)"}`,
                }}
                className="tabular-nums"
              >
                {displayedDispatches.length} {intakeFilter === "assigned" ? "Assigned" : "Total"} {displayedDispatches.length === 1 ? "Incident" : "Incidents"}
              </span>
            </div>
          </div>

          {displayedDispatches.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: "12.5px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "8px",
                border: "1px dashed var(--border-subtle)",
              }}
            >
              <CheckCircle2 size={28} color="#10b981" style={{ margin: "0 auto 8px" }} />
              <div>No active emergency casualties routed to {currentHospital.name} right now.</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                Switch to "All City Distress Calls" above to review other incidents in the network and see why your hospital is currently not selected.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {displayedDispatches.map((inc) => {
                const evalResult = evaluateHospitalEligibility(currentHospital, inc, hospitals);
                const isMatchedToThis = evalResult.isDesignated;
                const assignedFacName = evalResult.assignedHospitalName;
                const assignedDistanceKm = evalResult.assignedDistanceKm;
                const vehicleId =
                  inc.acceptance?.ambulance_id ||
                  inc.action_plan?.selected_facility?.assigned_ambulance_id ||
                  `AMB-${currentHospital.id.slice(-2).toUpperCase()}104`;
                const etaMinutes = evalResult.etaMinutes;
                const distanceKm = evalResult.distanceKm;
                const victimCount = evalResult.victimCount;
                const isAccepted = inc.status === "accepted_en_route" || !!inc.acceptance;

                return (
                  <div
                    key={inc.incident_id}
                    style={{
                      background: "rgba(0, 0, 0, 0.2)",
                      border: "1px solid var(--border-subtle)",
                      borderLeft: `4px solid ${isMatchedToThis ? "var(--critical)" : "var(--warning)"}`,
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: inc.urgency === "high" || inc.urgency === "critical" ? "rgba(244, 63, 94, 0.2)" : "rgba(245, 158, 11, 0.2)",
                              color: inc.urgency === "high" || inc.urgency === "critical" ? "#f43f5e" : "#f59e0b",
                              textTransform: "uppercase",
                            }}
                          >
                            {inc.urgency} URGENCY
                          </span>
                          <span style={{ fontSize: "13.5px", fontWeight: 700 }}>
                            {inc.intent || inc.need_type || "Emergency Casualty Report"}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: isMatchedToThis ? "var(--success-bg)" : "var(--warning-bg)",
                              border: `1px solid ${isMatchedToThis ? "var(--success-border)" : "var(--warning-border)"}`,
                              color: isMatchedToThis ? "var(--success-text)" : "var(--warning-text)",
                            }}
                          >
                            {isMatchedToThis ? "✅ Designated Facility" : `🔒 Ineligible • Handled by ${assignedFacName}`}
                          </span>
                        </div>

                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <span>📍 <strong>Origin:</strong> {evalResult.locationText} ({evalResult.victimLat.toFixed(4)}, {evalResult.victimLng.toFixed(4)})</span>
                          <span>⏱️ <strong>Distance from {currentHospital.name}:</strong> {distanceKm} km (~{etaMinutes} min)</span>
                          <span>🚑 <strong>Assigned Unit:</strong> <strong style={{ color: "#38bdf8" }}>{vehicleId}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                          {isMatchedToThis ? (
                            <>
                              <div style={{ fontSize: "18px", fontWeight: 900, color: "#f43f5e" }}>
                                {victimCount} {victimCount === 1 ? "Victim" : "Victims"}
                              </div>
                              <div style={{ fontSize: "10.5px", color: "var(--success-text)", fontWeight: 600 }}>
                                Allocated to this ER
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--warning)" }}>
                                {assignedFacName}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                Primary CAD Allocation ({assignedDistanceKm} km)
                              </div>
                            </>
                          )}
                        </div>

                        {/* Approve button only available to eligible hospital */}
                        {isMatchedToThis ? (
                          isAccepted ? (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "7px 12px",
                                borderRadius: "6px",
                                background: "var(--success-bg)",
                                border: "1px solid var(--success-border)",
                                color: "var(--success-text)",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Intake Approved • {vehicleId} En Route</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={approvingId === inc.incident_id}
                              onClick={() => handleApproveIntake(inc)}
                              className="btn btn-primary"
                              style={{
                                padding: "8px 14px",
                                fontSize: "12px",
                                fontWeight: 600,
                                gap: "6px",
                              }}
                            >
                              <Check size={14} />
                              {approvingId === inc.incident_id ? "Approving..." : "Approve Intake & Dispatch"}
                            </button>
                          )
                        ) : (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 11px",
                              borderRadius: "6px",
                              background: "rgba(245, 158, 11, 0.12)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              color: "#f59e0b",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            <Lock size={12} />
                            <span>Approval Locked: Ineligible Facility</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* What this hospital lacks in service for this request */}
                    {!isMatchedToThis && evalResult.deficiencies.length > 0 && (
                      <div
                        style={{
                          background: "rgba(244, 63, 94, 0.05)",
                          border: "1px solid rgba(244, 63, 94, 0.2)",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#f43f5e", fontSize: "11px", fontWeight: 700 }}>
                          <AlertTriangle size={13} />
                          <span>What {currentHospital.name} Lacks in Current Service to Receive Approval Option:</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {evalResult.deficiencies.map((d, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: "10.5px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <strong style={{ color: "var(--text-primary)" }}>• {d.title}:</strong> {d.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
