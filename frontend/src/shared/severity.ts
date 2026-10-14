type Urgency = "critical" | "high" | "medium" | "low";

export function getSeverityColor(urgency: Urgency): string {
  switch (urgency) {
    case "critical":
    case "high":
      return "red";

    case "medium":
      return "yellow";

    case "low":
    default:
      return "green";
  }
}