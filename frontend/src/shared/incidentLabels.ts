const NEED_TYPE_LABELS: Record<string, string> = {
  fire: "Fire Emergency",
  flood_rescue: "Flood / Rescue",
  medical: "Medical Emergency",
  shelter: "Shelter Request",
  food: "Food / Supplies Request",
  other: "Help Request",
};

export function getIncidentLabel(needType?: string): string {
  if (!needType) return "Help Request";
  return NEED_TYPE_LABELS[needType] ?? "Help Request";
}