import {
  Tent,
  Droplet,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface Resource {
  name: string;
  type: string;
  area: string;
  capacity: string;
  icon: LucideIcon;
}

const RESOURCES: Resource[] = [
  {
    name: "Govt School Relief Camp",
    type: "Shelter",
    area: "Rajendra Nagar",
    capacity: "120/200",
    icon: Tent,
  },
  {
    name: "Community Hall Shelter",
    type: "Shelter",
    area: "Ameerpet",
    capacity: "80/150",
    icon: Tent,
  },
  {
    name: "Water Tanker Point 3",
    type: "Water",
    area: "Kukatpally",
    capacity: "5000L available",
    icon: Droplet,
  },
  {
    name: "Mobile Food Van A",
    type: "Food",
    area: "Attapur",
    capacity: "300 meals/day",
    icon: UtensilsCrossed,
  },
  {
    name: "Charging Station – Metro",
    type: "Power",
    area: "Ameerpet",
    capacity: "40 ports",
    icon: Zap,
  },
];

export default function ResourcesView(): React.ReactElement {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Relief Resources</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {RESOURCES.map((resource) => {
          const Icon = resource.icon;

          return (
            <div
              key={resource.name}
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <Icon size={16} color="var(--accent)" />

                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  {resource.name}
                </span>
              </div>

              <div
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-secondary)",
                }}
              >
                {resource.type} &middot; {resource.area}
              </div>

              <div
                className="tabular-nums"
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  marginTop: 4,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {resource.capacity}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}