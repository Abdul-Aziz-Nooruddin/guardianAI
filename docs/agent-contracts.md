## Victim Assistance Agent
Input:  { "message": "...", "user_id": "u123" }
Output: {
  "location_text": "Ameerpet",
  "latitude": 17.4374, "longitude": 78.4482,
  "need_type": "medical",
  "urgency": "high",
  "language_detected": "hi-te-mixed",
  "victim_reply": "Help is on the way. Nearest shelter: Govt School, Rajendra Nagar."
}

## Emergency Intelligence Agent
Input:  array of Report objects
Output: {
  "incident_id": "inc_001",
  "cluster_size": 3,
  "victim_count_estimate": 18,
  "confidence": 0.86,
  "urgency": "critical",
  "is_stale": false
}

## Resource Finder Agent
Input:  { "incident_id": "inc_001", "victim_count": 18, "need_type": "medical", "area": "Ameerpet" }
Output: {
  "distribution_plan": [
    { "hospital_id": "h_b", "hospital_name": "Hospital B", "victims_assigned": 8, "beds_available": 18 },
    { "hospital_id": "h_c", "hospital_name": "Hospital C", "victims_assigned": 6, "beds_available": 11 },
    { "hospital_id": "h_a", "hospital_name": "Hospital A", "victims_assigned": 4, "beds_available": 6 }
  ],
  "eta_minutes": 23
}

## NGO Dashboard Agent
Input:  outputs from Emergency Intelligence + Resource Finder
Output: {
  "incident_id": "inc_001",
  "action_plan": { "...Resource Finder output..." },
  "reasoning": ["Hospital B ICU capacity available (18%)", "..."],
  "confidence": 0.96
}

## Role Permissions
ngo, disaster_management -> full dashboard (incidents, map, action_plan, hospitals, analytics, pipeline)
fire_brigade -> incidents, map
medical -> hospitals, action_plan
police -> incidents
volunteer_coordinator -> incidents, dispatch