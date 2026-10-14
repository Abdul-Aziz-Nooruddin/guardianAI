export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ngo: ["incidents", "map", "action_plan", "hospitals"],
  disaster_management: ["incidents", "map", "action_plan", "hospitals"],
  fire_brigade: ["incidents", "map"],
  medical: ["hospitals", "action_plan"],
  police: ["incidents"],
  volunteer_coordinator: ["incidents"],
};

export function canView(role: string, panelKey: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(panelKey) ?? false;
}