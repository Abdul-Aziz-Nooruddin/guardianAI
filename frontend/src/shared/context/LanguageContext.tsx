import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedLanguage = "en" | "te" | "hi" | "ur";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", speechCode: "en-IN" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", speechCode: "te-IN" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", speechCode: "hi-IN" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", speechCode: "ur-IN" },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation & Common
    "nav.guardian": "Guardian",
    "nav.cad_version": "CAD 2.0",
    "nav.hyderabad_ops": "Hyderabad Emergency Operations",
    "nav.hospital_portal": "Hospital Portal",
    "nav.citizen_portal": "Citizen SOS App",
    "nav.responder_portal": "Responder Command Center",
    "nav.back": "Back",
    "nav.live_mesh": "REALTIME MESH",
    "nav.telemetry_summary": "4 Hospitals • 11 Ambulances • Realtime CAD",
    "nav.language": "Language",

    // Portal Selector
    "landing.tag": "MULTI-AGENCY DISPATCH PLATFORM",
    "landing.title": "Select Operational Portal",
    "landing.subtitle": "Direct access to public distress reporting, multi-agency responder CAD, or hospital fleet telemetry.",
    "landing.citizen_badge": "PUBLIC ACCESS",
    "landing.citizen_title": "Citizen Distress Portal",
    "landing.citizen_desc": "For victims and bystanders reporting accidents, fires, or medical crises. Supports vernacular voice dictation, verified GPS geolocation, and on-scene camera upload.",
    "landing.citizen_btn": "Open Citizen Portal",
    "landing.responder_badge": "OFFICIAL RESPONDER USE",
    "landing.responder_title": "Responder Command Center",
    "landing.responder_desc": "Role-based dispatch terminals for Medical Trauma ERs, Fire & Rescue Stations, Police Traffic CAD, and Disaster Management Authorities.",
    "landing.responder_btn": "Authenticate as Responder",
    "landing.hospital_badge": "HMIS & FLEET CONSOLE",
    "landing.hospital_title": "Hospital Operations Portal",
    "landing.hospital_desc": "Update available ambulance fleets, ICU bed capacity, and emergency intake triage in real time. Direct telemetry guidance for AI Resource Allocation.",
    "landing.hospital_btn": "Manage Hospital Fleet",
    "landing.footer": "Monitored Facilities: Aster Prime (Ameerpet) • Sunshine (Secunderabad) • Apollo (Banjara Hills) • KIMS (Kukatpally) • WebSocket Realtime CAD Gateway Active",

    // Hospital Portal
    "hospital.title": "Hospital Operations & Telemetry Console",
    "hospital.subtitle": "Direct HMIS integration • Updates broadcast live to AI Triage & Responder CAD",
    "hospital.select_facility": "SELECT ACTIVE MEDICAL FACILITY:",
    "hospital.managing": "MANAGING",
    "hospital.last_sync": "Last City Mesh Sync:",
    "hospital.amb_fleet_title": "Ambulance Fleet Availability",
    "hospital.amb_fleet_sub": "Real-time units ready for dispatch",
    "hospital.fleet_exhausted": "FLEET EXHAUSTED",
    "hospital.units_available": "UNITS READY",
    "hospital.active_free_amb": "Active Free Ambulances",
    "hospital.quick_set": "Quick Set Ambulance Numbers:",
    "hospital.none": "0 (None)",
    "hospital.free": "Free",
    "hospital.amb_hint": "Setting to ≥ 1 elevates this hospital to Qualified in AI Triage, dispatching your units to on-scene emergencies.",
    "hospital.beds_icu_title": "Critical Care Beds & ICU Capacity",
    "hospital.beds_icu_sub": "Emergency trauma ward occupancy",
    "hospital.available_icu": "Available ICU Beds",
    "hospital.icu_occupancy": "ICU Occupancy",
    "hospital.occupied": "Occupied",
    "hospital.general_beds": "General / Trauma Beds",
    "hospital.ward_occupancy": "Ward Occupancy",
    "hospital.er_doctors": "On-Duty ER Doctors",
    "hospital.er_doctors_sub": "Trauma surgeons & emergency physicians",
    "hospital.triage_mode_title": "Facility Intake & Triage Mode",
    "hospital.triage_mode_sub": "Dynamic triage broadcast to CAD & Responders",
    "hospital.auto_sensing": "AUTO SENSING",
    "hospital.auto_decision": "Active Auto-Triage Decision",
    "hospital.reacts_live": "Reacts live to Beds, ICU, Docs, Ambs",
    "hospital.operational": "Operational",
    "hospital.operational_sub": "Normal intake",
    "hospital.surging": "Surge Priority",
    "hospital.surging_sub": "Critical trauma only",
    "hospital.diverting": "Diverting",
    "hospital.diverting_sub": "Reroute minor cases",
    "hospital.code_black": "Code Black",
    "hospital.code_black_sub": "Zero intake capacity",
    "hospital.direct_hotline": "Direct CAD Hotline:",
    "hospital.clinical_specialists": "Clinical Specialists:",
    "hospital.live_casualties_title": "Live Emergency Casualties Routing to Facility",
    "hospital.live_casualties_sub": "Emergency distress reports from citizens and responders requiring hospital intake triage.",
    "hospital.approve_btn": "Approve Clinical Intake & Dispatch",
    "hospital.approved_status": "Intake Confirmed — Unit En Route",
    "hospital.awaiting_intake": "Awaiting Hospital Approval",
    "hospital.victim": "Victim",
    "hospital.victims": "Victims",
    "hospital.auto_triage_toggle": "Auto-Triage",
    "hospital.auto_triage_on": "ON (Dynamic)",
    "hospital.auto_triage_manual": "MANUAL OVERRIDE",

    // Notices & Toasts
    "notice.icu_updated": "ICU availability updated.",
    "notice.bed_updated": "General trauma bed count updated.",
    "notice.amb_updated": "Ambulance fleet availability updated.",
    "notice.docs_updated": "On-duty emergency physician count updated.",
    "notice.status_updated": "Facility triage status updated.",
    "notice.intake_approved": "Clinical Intake Approved! Trauma bay reserved and ambulance unit deployed.",

    // Citizen Chat
    "citizen.title": "Citizen Distress Intake",
    "citizen.subtitle": "Guardian Public Safety Network • Hyderabad Metro Emergency Gateway",
    "citizen.national_112": "National: 112",
    "citizen.medical_108": "Medical: 108",
    "citizen.fire_101": "Fire: 101",
    "citizen.cad_active": "CAD Active",
    "citizen.input_placeholder": "Describe what happened, injuries, or speak in your language...",
    "citizen.send": "Send",
    "citizen.listening": "Listening... Speak now",
    "citizen.quick_reports": "QUICK EMERGENCY REPORT",
    "citizen.road_accident": "Road Accident",
    "citizen.fire_emergency": "Structural Fire",
    "citizen.water_logging": "Multiple Collision",

    // Responder
    "responder.role_select_title": "Emergency Responder Terminal",
    "responder.role_select_sub": "Select your operational division to enter real-time CAD dispatch.",
    "responder.medical_title": "Medical & EMS Command",
    "responder.medical_desc": "Trauma room capacity, ambulance fleets, ICU triage verification, and incoming critical casualty intake.",
    "responder.fire_title": "Fire & Rescue Operations",
    "responder.fire_desc": "Substation engine dispatch, aerial ladder platforms, foam tenders, and HAZMAT structural rescue squads.",
    "responder.police_title": "Police & Traffic Control",
    "responder.police_desc": "Emergency green-corridor clearance, incident perimeter security, traffic diversions, and crowd control.",
    "responder.disaster_title": "Disaster Management Authority",
    "responder.disaster_desc": "Cross-agency command authority for floods, building collapses, mass-casualty events, and evacuation corridors.",
    "responder.enter_cad": "Enter Command Terminal",
  },

  te: {
    // Navigation & Common
    "nav.guardian": "గార్డియన్",
    "nav.cad_version": "CAD 2.0",
    "nav.hyderabad_ops": "హైదరాబాద్ అత్యవసర ఆపరేషన్స్",
    "nav.hospital_portal": "ఆసుపత్రి పోర్టల్",
    "nav.citizen_portal": "పౌరుల SOS యాప్",
    "nav.responder_portal": "రెస్పాండర్ కమాండ్ సెంటర్",
    "nav.back": "వెనుకకు",
    "nav.live_mesh": "రియల్ టైమ్ మెష్",
    "nav.telemetry_summary": "4 ఆసుపత్రులు • 11 అంబులెన్సులు • లైవ్ CAD",
    "nav.language": "భాష",

    // Portal Selector
    "landing.tag": "మల్టీ-ఏజెన్సీ డిస్పాచ్ ప్లాట్‌ఫారమ్",
    "landing.title": "ఆపరేషనల్ పోర్టల్ ఎంచుకోండి",
    "landing.subtitle": "ప్రజా అత్యవసర రిపోర్టింగ్, రెస్పాండర్ CAD మరియు ఆసుపత్రి ఫ్లీట్ టెలిమెట్రీని యాక్సెస్ చేయండి.",
    "landing.citizen_badge": "ప్రజా యాక్సెస్",
    "landing.citizen_title": "పౌరుల అత్యవసర పోర్టల్",
    "landing.citizen_desc": "ప్రమాదాలు, అగ్నిప్రమాదాలు లేదా వైద్య అత్యవసర పరిస్థితులను నివేదించడానికి. తెలుగు/స్థానిక వాయిస్, GPS లొకేషన్ మరియు ఫోటో అప్‌లోడ్‌కు మద్దతు ఉంది.",
    "landing.citizen_btn": "పౌరుల పోర్టల్ తెరవండి",
    "landing.responder_badge": "అధికారిక రెస్పాండర్ల కోసం",
    "landing.responder_title": "రెస్పాండర్ కమాండ్ సెంటర్",
    "landing.responder_desc": "ట్రామా ER, అగ్నిమాపక కేంద్రాలు, పోలీస్ ట్రాఫిక్ CAD మరియు విపత్తు నిర్వహణ అధికారుల కోసం డిస్పాచ్ టెర్మినల్స్.",
    "landing.responder_btn": "రెస్పాండర్‌గా లాగిన్ అవ్వండి",
    "landing.hospital_badge": "HMIS & ఫ్లీట్ కన్సోల్",
    "landing.hospital_title": "ఆసుపత్రి ఆపరేషన్స్ పోర్టల్",
    "landing.hospital_desc": "అందుబాటులో ఉన్న అంబులెన్సులు, ICU బెడ్ కెపాసిటీ మరియు ఎమర్జెన్సీ ట్రయాజ్‌ను నిజ సమయంలో అప్‌డేట్ చేయండి.",
    "landing.hospital_btn": "ఆసుపత్రి ఫ్లీట్‌ను నిర్వహించండి",
    "landing.footer": "కనెక్ట్ అయిన ఆసుపత్రులు: ఆస్టర్ ప్రైమ్ • సన్‌షైన్ • అపోలో • కిమ్స్ • రియల్ టైమ్ CAD గేట్‌వే యాక్టివ్",

    // Hospital Portal
    "hospital.title": "ఆసుపత్రి ఆపరేషన్స్ & టెలిమెట్రీ కన్సోల్",
    "hospital.subtitle": "డైరెక్ట్ HMIS ఇంటిగ్రేషన్ • AI ట్రయాజ్ & రెస్పాండర్ CADకి ప్రత్యక్ష ప్రసారం",
    "hospital.select_facility": "క్రియాశీల ఆసుపత్రిని ఎంచుకోండి:",
    "hospital.managing": "నిర్వహిస్తున్నారు",
    "hospital.last_sync": "చివరి సింక్ సమయం:",
    "hospital.amb_fleet_title": "అంబులెన్స్ ఫ్లీట్ లభ్యత",
    "hospital.amb_fleet_sub": "డిస్పాచ్ కోసం సిద్ధంగా ఉన్న వాహనాలు",
    "hospital.fleet_exhausted": "వాహనాలు ఖాళీగా లేవు",
    "hospital.units_available": "సిద్ధంగా ఉన్నాయి",
    "hospital.active_free_amb": "అందుబాటులో ఉన్న అంబులెన్సులు",
    "hospital.quick_set": "అంబులెన్స్ సంఖ్యలను సెట్ చేయండి:",
    "hospital.none": "0 (ఏమీ లేవు)",
    "hospital.free": "ఖాళీ",
    "hospital.amb_hint": "సంఖ్యను ≥ 1 కి సెట్ చేయడం ద్వారా అత్యవసర సమయాల్లో మీ వాహనాలను వేగంగా పంపవచ్చు.",
    "hospital.beds_icu_title": "క్రిటికల్ కేర్ బెడ్స్ & ICU కెపాసిటీ",
    "hospital.beds_icu_sub": "ఎమర్జెన్సీ వార్డు లభ్యత",
    "hospital.available_icu": "అందుబాటులో ఉన్న ICU బెడ్లు",
    "hospital.icu_occupancy": "ICU ఆక్యుపెన్సీ",
    "hospital.occupied": "నిండినవి",
    "hospital.general_beds": "జనరల్ / ట్రామా బెడ్లు",
    "hospital.ward_occupancy": "వార్డు ఆక్యుపెన్సీ",
    "hospital.er_doctors": "డ్యూటీలో ఉన్న ER వైద్యులు",
    "hospital.er_doctors_sub": "ట్రామా సర్జన్లు & ఎమర్జెన్సీ వైద్యులు",
    "hospital.triage_mode_title": "ట్రయాజ్ మోడ్ & అడ్మిషన్ స్థితి",
    "hospital.triage_mode_sub": "CAD మరియు రెస్పాండర్లకు ప్రసారం చేయబడే స్థితి",
    "hospital.auto_sensing": "ఆటో సెన్సింగ్",
    "hospital.auto_decision": "క్రియాశీల ఆటో-ట్రయాజ్ నిర్ణయం",
    "hospital.reacts_live": "బెడ్లు, ICU, డాక్టర్లు, అంబులెన్సుల ఆధారంగా ఆటో నిర్ణయం",
    "hospital.operational": "సాధారణం",
    "hospital.operational_sub": "సాధారణ అడ్మిషన్లు",
    "hospital.surging": "సర్జ్ ప్రాధాన్యత",
    "hospital.surging_sub": "తీవ్రమైన కేసులకు మాత్రమే",
    "hospital.diverting": "డైవర్టింగ్",
    "hospital.diverting_sub": "చిన్న కేసులను మళ్లించండి",
    "hospital.code_black": "కోడ్ బ్లాక్",
    "hospital.code_black_sub": "పూర్తిగా నిండిపోయింది",
    "hospital.direct_hotline": "డైరెక్ట్ CAD హాట్‌లైన్:",
    "hospital.clinical_specialists": "స్పెషలిస్టులు:",
    "hospital.live_casualties_title": "ఆసుపత్రికి వస్తున్న అత్యవసర బాధితులు",
    "hospital.live_casualties_sub": "ఆసుపత్రి ఆమోదం అవసరమైన పౌరుల మరియు రెస్పాండర్ల అత్యవసర అభ్యర్థనలు.",
    "hospital.approve_btn": "అడ్మిషన్ ఆమోదించి అంబులెన్స్ పంపండి",
    "hospital.approved_status": "ఆమోదించబడింది — వాహనం మార్గంలో ఉంది",
    "hospital.awaiting_intake": "ఆసుపత్రి ఆమోదం కోసం వేచి ఉంది",
    "hospital.victim": "బాధితుడు",
    "hospital.victims": "బాధితులు",
    "hospital.auto_triage_toggle": "ఆటో ట్రయాజ్",
    "hospital.auto_triage_on": "ఆన్ (డైనమిక్)",
    "hospital.auto_triage_manual": "మాన్యువల్ ఓవర్‌రైడ్",

    // Notices & Toasts
    "notice.icu_updated": "ICU లభ్యత నవీకరించబడింది.",
    "notice.bed_updated": "జనరల్ ట్రామా బెడ్ల సంఖ్య నవీకరించబడింది.",
    "notice.amb_updated": "అంబులెన్స్ ఫ్లీట్ లభ్యత నవీకరించబడింది.",
    "notice.docs_updated": "డ్యూటీలో ఉన్న ఎమర్జెన్సీ వైద్యుల సంఖ్య నవీకరించబడింది.",
    "notice.status_updated": "ఆసుపత్రి ట్రయాజ్ స్థితి నవీకరించబడింది.",
    "notice.intake_approved": "అడ్మిషన్ ఆమోదించబడింది! ట్రామా బే రిజర్వ్ చేయబడింది మరియు అంబులెన్స్ పంపబడింది.",

    // Citizen Chat
    "citizen.title": "పౌరుల అత్యవసర సహాయం",
    "citizen.subtitle": "గార్డియన్ పబ్లిక్ సేఫ్టీ నెట్‌వర్క్ • హైదరాబాద్ ఎమర్జెన్సీ గేట్‌వే",
    "citizen.national_112": "నేషనల్: 112",
    "citizen.medical_108": "వైద్యం: 108",
    "citizen.fire_101": "అగ్నిమాపక: 101",
    "citizen.cad_active": "CAD యాక్టివ్",
    "citizen.input_placeholder": "ఏమి జరిగిందో వివరించండి లేదా మైక్రోఫోన్‌తో మాట్లాడండి...",
    "citizen.send": "పంపండి",
    "citizen.listening": "వినబడుతోంది... మాట్లాడండి",
    "citizen.quick_reports": "త్వరిత ఎమర్జెన్సీ రిపోర్ట్",
    "citizen.road_accident": "రోడ్డు ప్రమాదం",
    "citizen.fire_emergency": "అగ్నిప్రమాదం",
    "citizen.water_logging": "భారీ వాహన ఢీ",

    // Responder
    "responder.role_select_title": "ఎమర్జెన్సీ రెస్పాండర్ టెర్మినల్",
    "responder.role_select_sub": "CAD డిస్పాచ్‌లోకి ప్రవేశించడానికి మీ విభాగాన్ని ఎంచుకోండి.",
    "responder.medical_title": "మెడికల్ & EMS కమాండ్",
    "responder.medical_desc": "ట్రామా రూమ్ కెపాసిటీ, అంబులెన్స్ ఫ్లీట్లు, ICU ట్రయాజ్ వెరిఫికేషన్.",
    "responder.fire_title": "అగ్నిమాపక & రెస్క్యూ ఆపరేషన్స్",
    "responder.fire_desc": "ఫైర్ ఇంజిన్ డిస్పాచ్, నిచ్చెన ప్లాట్‌ఫారమ్‌లు, రెస్క్యూ స్క్వాడ్‌లు.",
    "responder.police_title": "పోలీస్ & ట్రాఫిక్ కంట్రోల్",
    "responder.police_desc": "ఎమర్జెన్సీ గ్రీన్ కారిడార్ క్లియరెన్స్, ట్రాఫిక్ డైవర్షన్లు.",
    "responder.disaster_title": "విపత్తు నిర్వహణ అథారిటీ",
    "responder.disaster_desc": "వరదలు, భవనాల కూలిపోవడం, సహాయక చర్యల సమన్వయం.",
    "responder.enter_cad": "కమాండ్ టెర్మినల్‌లోకి ప్రవేశించండి",
  },

  hi: {
    // Navigation & Common
    "nav.guardian": "गार्डियन",
    "nav.cad_version": "CAD 2.0",
    "nav.hyderabad_ops": "हैदराबाद आपातकालीन संचालन",
    "nav.hospital_portal": "अस्पताल पोर्टल",
    "nav.citizen_portal": "नागरिक SOS ऐप",
    "nav.responder_portal": "रेस्पोंडर कमांड सेंटर",
    "nav.back": "वापस",
    "nav.live_mesh": "रीयल-टाइम मेश",
    "nav.telemetry_summary": "4 अस्पताल • 11 एम्बुलेंस • लाइव CAD",
    "nav.language": "भाषा",

    // Portal Selector
    "landing.tag": "मल्टी-एजेंसी डिस्पैच प्लेटफॉर्म",
    "landing.title": "ऑपरेशनल पोर्टल चुनें",
    "landing.subtitle": "सार्वजनिक आपातकालीन रिपोर्टिंग, रेस्पोंडर CAD और अस्पताल बेड़े टेलीमेट्री तक सीधी पहुंच।",
    "landing.citizen_badge": "सार्वजनिक पहुंच",
    "landing.citizen_title": "नागरिक आपातकालीन पोर्टल",
    "landing.citizen_desc": "दुर्घटनाओं, आग या चिकित्सीय आपात स्थितियों की रिपोर्ट करने वाले पीड़ितों और राहगीरों के लिए। स्थानीय आवाज, GPS और फोटो अपलोड का समर्थन।",
    "landing.citizen_btn": "नागरिक पोर्टल खोलें",
    "landing.responder_badge": "आधिकारिक रेस्पोंडर उपयोग",
    "landing.responder_title": "रेस्पोंडर कमांड सेंटर",
    "landing.responder_desc": "मेडिकल ट्रॉमा ER, फायर स्टेशन, पुलिस ट्रैफिक CAD और आपदा प्रबंधन अधिकारियों के लिए डिस्पैच टर्मिनल।",
    "landing.responder_btn": "रेस्पोंडर के रूप में लॉगिन करें",
    "landing.hospital_badge": "HMIS एवं फ्लीट कंसोल",
    "landing.hospital_title": "अस्पताल संचालन पोर्टल",
    "landing.hospital_desc": "उपलब्ध एम्बुलेंस, ICU बेड क्षमता और आपातकालीन सेवन ट्राइएज को वास्तविक समय में अपडेट करें।",
    "landing.hospital_btn": "अस्पताल बेड़ा प्रबंधित करें",
    "landing.footer": "निगरानी में अस्पताल: एस्टर प्राइम • सनशाइन • अपोलो • किम्स • रीयल-टाइम CAD गेटवे सक्रिय",

    // Hospital Portal
    "hospital.title": "अस्पताल संचालन एवं टेलीमेट्री कंसोल",
    "hospital.subtitle": "प्रत्यक्ष HMIS एकीकरण • AI ट्राइएज और रेस्पोंडर CAD को लाइव प्रसारण",
    "hospital.select_facility": "सक्रिय चिकित्सा सुविधा चुनें:",
    "hospital.managing": "प्रबंधन जारी",
    "hospital.last_sync": "अंतिम सिंक समय:",
    "hospital.amb_fleet_title": "एम्बुलेंस बेड़े की उपलब्धता",
    "hospital.amb_fleet_sub": "डिस्पैच के लिए तैयार इकाइयाँ",
    "hospital.fleet_exhausted": "कोई इकाई उपलब्ध नहीं",
    "hospital.units_available": "इकाइयाँ तैयार",
    "hospital.active_free_amb": "उपलब्ध खाली एम्बुलेंस",
    "hospital.quick_set": "एम्बुलेंस संख्या तुरंत सेट करें:",
    "hospital.none": "0 (कोई नहीं)",
    "hospital.free": "उपलब्ध",
    "hospital.amb_hint": "संख्या को ≥ 1 पर सेट करने से आपातकालीन स्थितियों में तुरंत सहायता भेजी जा सकती है।",
    "hospital.beds_icu_title": "क्रिटिकल केयर बेड और ICU क्षमता",
    "hospital.beds_icu_sub": "आपातकालीन ट्रॉमा वार्ड अधिभोग",
    "hospital.available_icu": "उपलब्ध ICU बेड",
    "hospital.icu_occupancy": "ICU अधिभोग",
    "hospital.occupied": "भरे हुए",
    "hospital.general_beds": "सामान्य / ट्रॉमा बेड",
    "hospital.ward_occupancy": "वार्ड अधिभोग",
    "hospital.er_doctors": "ड्यूटी पर ER डॉक्टर",
    "hospital.er_doctors_sub": "ट्रॉमा सर्जन और आपातकालीन चिकित्सक",
    "hospital.triage_mode_title": "ट्राइएज मोड एवं प्रवेश स्थिति",
    "hospital.triage_mode_sub": "CAD और रेस्पोंडर्स को प्रसारित स्थिति",
    "hospital.auto_sensing": "ऑटो सेंसिंग",
    "hospital.auto_decision": "सक्रिय ऑटो-ट्राइएज निर्णय",
    "hospital.reacts_live": "बेड, ICU, डॉक्टर और एम्बुलेंस के आधार पर लाइव प्रतिक्रिया",
    "hospital.operational": "सामान्य",
    "hospital.operational_sub": "सामान्य प्रवेश",
    "hospital.surging": "सर्ज प्राथमिकता",
    "hospital.surging_sub": "केवल गंभीर ट्रॉमा",
    "hospital.diverting": "डायवर्टिंग",
    "hospital.diverting_sub": "छोटे मामले अन्यत्र भेजें",
    "hospital.code_black": "कोड ब्लैक",
    "hospital.code_black_sub": "शून्य क्षमता (पूर्ण)",
    "hospital.direct_hotline": "सीधी CAD हॉटलाइन:",
    "hospital.clinical_specialists": "चिकित्सा विशेषज्ञ:",
    "hospital.live_casualties_title": "सुविधा की ओर आ रहे आपातकालीन हताहत",
    "hospital.live_casualties_sub": "नागरिकों और रेस्पोंडर्स की आपातकालीन रिपोर्ट जिन्हें अस्पताल की मंजूरी चाहिए।",
    "hospital.approve_btn": "प्रवेश स्वीकृत करें और वाहन भेजें",
    "hospital.approved_status": "स्वीकृत — वाहन रास्ते में है",
    "hospital.awaiting_intake": "अस्पताल की मंजूरी की प्रतीक्षा",
    "hospital.victim": "पीड़ित",
    "hospital.victims": "पीड़ित",
    "hospital.auto_triage_toggle": "ऑटो ट्राइएज",
    "hospital.auto_triage_on": "चालू (डायनामिक)",
    "hospital.auto_triage_manual": "मैन्युअल ओवरराइड",

    // Notices & Toasts
    "notice.icu_updated": "आईसीयू उपलब्धता अपडेट की गई।",
    "notice.bed_updated": "सामान्य ट्रॉमा बेड संख्या अपडेट की गई।",
    "notice.amb_updated": "एम्बुलेंस बेड़े की उपलब्धता अपडेट की गई।",
    "notice.docs_updated": "ड्यूटी पर डॉक्टरों की संख्या अपडेट की गई।",
    "notice.status_updated": "अस्पताल ट्राइएज स्थिति अपडेट की गई।",
    "notice.intake_approved": "मरीज़ प्रवेश स्वीकृत! ट्रॉमा बे आरक्षित और एम्बुलेंस रवाना की गई।",

    // Citizen Chat
    "citizen.title": "नागरिक आपातकालीन सहायता",
    "citizen.subtitle": "गार्डियन सार्वजनिक सुरक्षा नेटवर्क • हैदराबाद मेट्रो इमरजेंसी गेटवे",
    "citizen.national_112": "राष्ट्रीय: 112",
    "citizen.medical_108": "चिकित्सा: 108",
    "citizen.fire_101": "अग्निशामक: 101",
    "citizen.cad_active": "CAD सक्रिय",
    "citizen.input_placeholder": "घटना का विवरण दें या माइक से बोलें...",
    "citizen.send": "भेजें",
    "citizen.listening": "सुन रहे हैं... अब बोलें",
    "citizen.quick_reports": "त्वरित आपातकालीन रिपोर्ट",
    "citizen.road_accident": "सड़क दुर्घटना",
    "citizen.fire_emergency": "आग की आपात स्थिति",
    "citizen.water_logging": "बड़ा वाहन टकराव",

    // Responder
    "responder.role_select_title": "आपातकालीन रेस्पोंडर टर्मिनल",
    "responder.role_select_sub": "CAD डिस्पैच में प्रवेश करने के लिए अपना विभाग चुनें।",
    "responder.medical_title": "मेडिकल और EMS कमांड",
    "responder.medical_desc": "ट्रॉमा रूम क्षमता, एम्बुलेंस बेड़े, ICU ट्राइएज सत्यापन।",
    "responder.fire_title": "अग्निशमन एवं बचाव अभियान",
    "responder.fire_desc": "फायर इंजन डिस्पैच, सीढ़ी प्लेटफॉर्म, बचाव दल।",
    "responder.police_title": "पुलिस एवं यातायात नियंत्रण",
    "responder.police_desc": "ग्रीन कॉरिडोर क्लीयरेंस, परिधि सुरक्षा, यातायात डायवर्जन।",
    "responder.disaster_title": "आपदा प्रबंधन प्राधिकरण",
    "responder.disaster_desc": "बाढ़, इमारत ढहने और बड़ी आपदाओं में अंतर-एजेंसी समन्वय।",
    "responder.enter_cad": "कमांड टर्मिनल में प्रवेश करें",
  },

  ur: {
    // Navigation & Common
    "nav.guardian": "گارڈین",
    "nav.cad_version": "CAD 2.0",
    "nav.hyderabad_ops": "حیدرآباد ایمرجنسی آپریشنز",
    "nav.hospital_portal": "ہسپتال پورٹل",
    "nav.citizen_portal": "شہری SOS ایپ",
    "nav.responder_portal": "رسپانڈر کمانڈ سینٹر",
    "nav.back": "واپس",
    "nav.live_mesh": "ریئل ٹائم میش",
    "nav.telemetry_summary": "4 ہسپتال • 11 ایمبولینسز • لائیو CAD",
    "nav.language": "زبان",

    // Portal Selector
    "landing.tag": "ملٹی ایجنسی ڈسپیچ پلیٹ فارم",
    "landing.title": "آپریشنل پورٹل منتخب کریں",
    "landing.subtitle": "عوامی ایمرجنسی رپورٹنگ، رسپانڈر CAD اور ہسپتال فلیٹ ٹیلی میٹری تک براہ راست رسائی۔",
    "landing.citizen_badge": "عوامی رسائی",
    "landing.citizen_title": "شہری ایمرجنسی پورٹل",
    "landing.citizen_desc": "حادثات، آگ یا طبی ہنگامی حالات کی اطلاع دینے کے لیے۔ مقامی آواز، GPS اور تصویر اپ لوڈ کی سہولت۔",
    "landing.citizen_btn": "شہری پورٹل کھولیں",
    "landing.responder_badge": "سرکاری رسپانڈرز کے لیے",
    "landing.responder_title": "رسپانڈر کمانڈ سینٹر",
    "landing.responder_desc": "میڈیکل ٹراما ER، فائر اسٹیشنز، پولیس ٹریفک CAD اور ڈیزاسٹر مینجمنٹ کے لیے ڈسپیچ ٹرمینلز۔",
    "landing.responder_btn": "بطور رسپانڈر لاگ ان کریں",
    "landing.hospital_badge": "HMIS اور فلیٹ کنسول",
    "landing.hospital_title": "ہسپتال آپریشنز پورٹل",
    "landing.hospital_desc": "دستیاب ایمبولینسز، ICU بستروں کی گنجائش اور ایمرجنسی ٹرائیج کو فوری اپ ڈیٹ کریں۔",
    "landing.hospital_btn": "ہسپتال فلیٹ کا انتظام کریں",
    "landing.footer": "زیر نگرانی ہسپتال: ایسٹر پرائم • سن شائن • اپالو • کِمز • ریئل ٹائم گیٹ وے فعال",

    // Hospital Portal
    "hospital.title": "ہسپتال آپریشنز اور ٹیلی میٹری کنسول",
    "hospital.subtitle": "براہ راست HMIS انضمام • AI ٹرائیج اور رسپانڈرز کو براہ راست نشریات",
    "hospital.select_facility": "فعال ہسپتال منتخب کریں:",
    "hospital.managing": "زیر انتظام",
    "hospital.last_sync": "آخری سنک کا وقت:",
    "hospital.amb_fleet_title": "ایمبولینس فلیٹ کی دستیابی",
    "hospital.amb_fleet_sub": "روانگی کے لیے تیار یونٹس",
    "hospital.fleet_exhausted": "کوئی یونٹ دستیاب نہیں",
    "hospital.units_available": "یونٹس تیار ہیں",
    "hospital.active_free_amb": "دستیاب خالی ایمبولینسز",
    "hospital.quick_set": "ایمبولینس کی تعداد فوری منتخب کریں:",
    "hospital.none": "0 (کوئی نہیں)",
    "hospital.free": "دستیاب",
    "hospital.amb_hint": "تعداد کو 1 یا زیادہ رکھنے سے ہنگامی حالات میں آپ کی ایمبولینسز فوری روانہ ہو سکتی ہیں۔",
    "hospital.beds_icu_title": "کریٹیکل کیئر اور ICU گنجائش",
    "hospital.beds_icu_sub": "ایمرجنسی ٹراما وارڈ کی گنجائش",
    "hospital.available_icu": "دستیاب ICU بستر",
    "hospital.icu_occupancy": "ICU قبضہ",
    "hospital.occupied": "بھرے ہوئے",
    "hospital.general_beds": "جنرل / ٹراما بستر",
    "hospital.ward_occupancy": "وارڈ قبضہ",
    "hospital.er_doctors": "ڈیوٹی پر موجود ڈاکٹرز",
    "hospital.er_doctors_sub": "ٹراما سرجنز اور ایمرجنسی ڈاکٹرز",
    "hospital.triage_mode_title": "ٹرائیج موڈ اور داخلہ کی حالت",
    "hospital.triage_mode_sub": "CAD اور رسپانڈرز کو نشر ہونے والی حالت",
    "hospital.auto_sensing": "آٹو سینسنگ",
    "hospital.auto_decision": "فعال آٹو ٹرائیج فیصلہ",
    "hospital.reacts_live": "بستروں، ICU، ڈاکٹرز اور ایمبولینسز کی بنیاد پر خودکار فیصلہ",
    "hospital.operational": "معمول کے مطابق",
    "hospital.operational_sub": "عام داخلہ",
    "hospital.surging": "سرج ترجیح",
    "hospital.surging_sub": "صرف شدید خطرہ",
    "hospital.diverting": "منتقل کر رہے ہیں",
    "hospital.diverting_sub": "معمولی کیسز منتقل کریں",
    "hospital.code_black": "کوڈ بلیک",
    "hospital.code_black_sub": "مکمل گنجائش ختم",
    "hospital.direct_hotline": "براہ راست ہاٹ لائن:",
    "hospital.clinical_specialists": "ماہرین:",
    "hospital.live_casualties_title": "ہسپتال کی طرف آنے والے ہنگامی مریض",
    "hospital.live_casualties_sub": "شہریوں اور رسپانڈرز کی ہنگامی رپورٹس جنہیں ہسپتال کی منظوری درکار ہے۔",
    "hospital.approve_btn": "داخلہ منظور کریں اور یونٹ روانہ کریں",
    "hospital.approved_status": "منظور شدہ — یونٹ راستے میں ہے",
    "hospital.awaiting_intake": "ہسپتال کی منظوری کا انتظار",
    "hospital.victim": "مریض",
    "hospital.victims": "مریض",
    "hospital.auto_triage_toggle": "آٹو ٹرائیج",
    "hospital.auto_triage_on": "آن (خودکار)",
    "hospital.auto_triage_manual": "دستی اوور رائیڈ",

    // Notices & Toasts
    "notice.icu_updated": "آئی سی یو کی دستیابی اپ ڈیٹ ہو گئی ہے۔",
    "notice.bed_updated": "جنرل ٹراما بستروں کی تعداد اپ ڈیٹ ہو گئی۔",
    "notice.amb_updated": "ایمبولینس فلیٹ کی دستیابی اپ ڈیٹ ہو گئی۔",
    "notice.docs_updated": "ڈیوٹی پر ڈاکٹروں کی تعداد اپ ڈیٹ ہو گئی۔",
    "notice.status_updated": "ہسپتال ٹرائیج کی حالت اپ ڈیٹ ہو گئی۔",
    "notice.intake_approved": "مریض کا داخلہ منظور! ٹراما بیڈ محفوظ اور ایمبولینس روانہ کر دی گئی۔",

    // Citizen Chat
    "citizen.title": "شہری ہنگامی امداد",
    "citizen.subtitle": "گارڈین پبلک سیفٹی نیٹ ورک • حیدرآباد میٹرو گیٹ وے",
    "citizen.national_112": "قومی: 112",
    "citizen.medical_108": "طبی: 108",
    "citizen.fire_101": "فائر: 101",
    "citizen.cad_active": "CAD فعال",
    "citizen.input_placeholder": "صورتحال بیان کریں یا مائیک سے بولیں...",
    "citizen.send": "ارسال",
    "citizen.listening": "سن رہے ہیں... اب بولیں",
    "citizen.quick_reports": "فوری ہنگامی رپورٹ",
    "citizen.road_accident": "سڑک حادثہ",
    "citizen.fire_emergency": "آگ لگنے کا واقعہ",
    "citizen.water_logging": "بڑی گاڑیوں کا تصادم",

    // Responder
    "responder.role_select_title": "ایمرجنسی رسپانڈر ٹرمینل",
    "responder.role_select_sub": "CAD ڈسپیچ میں داخل ہونے کے لیے اپنا شعبہ منتخب کریں۔",
    "responder.medical_title": "میڈیکل اور EMS کمانڈ",
    "responder.medical_desc": "ٹراما روم گنجائش، ایمبولینس فلیٹ، ICU تصدیق۔",
    "responder.fire_title": "فائر اینڈ ریسکیو آپریشنز",
    "responder.fire_desc": "فائر انجن ڈسپیچ، سیڑھی پلیٹ فارمز، امدادی ٹیمیں۔",
    "responder.police_title": "پولیس اور ٹریفک کنٹرول",
    "responder.police_desc": "گرین کوریڈور، سیکورٹی اور ٹریفک ڈائیورژن۔",
    "responder.disaster_title": "ڈیزاسٹر مینجمنٹ اتھارٹی",
    "responder.disaster_desc": "سیلاب، عمارت گرنے کے واقعات میں مشترکہ رابطہ۔",
    "responder.enter_cad": "کمانڈ ٹرمینل میں داخل ہوں",
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  speechCode: string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "guardian_app_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
      if (saved && (saved === "en" || saved === "te" || saved === "hi" || saved === "ur")) {
        return saved;
      }
    }
    return "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    }
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return fallback || key;
  };

  const currentOption = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const speechCode = currentOption ? currentOption.speechCode : "en-IN";
  const isRtl = language === "ur";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, speechCode, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
