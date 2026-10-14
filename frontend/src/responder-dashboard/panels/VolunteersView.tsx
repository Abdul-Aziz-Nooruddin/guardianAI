import { useState } from "react";
import { UserCheck } from "lucide-react";

interface Volunteer {
  id: number;
  name: string;
  area: string;
  skill: string;
  status: "available" | "assigned";
}

const VOLUNTEERS: Volunteer[] = [
  {
    id: 1,
    name: "Ravi Kumar",
    area: "Ameerpet",
    skill: "First Aid",
    status: "available",
  },
  {
    id: 2,
    name: "Sneha Reddy",
    area: "Kukatpally",
    skill: "Boat Operator",
    status: "available",
  },
  {
    id: 3,
    name: "Imran Sheikh",
    area: "Banjara Hills",
    skill: "Medical (Nurse)",
    status: "assigned",
  },
  {
    id: 4,
    name: "Priya Nair",
    area: "Attapur",
    skill: "Logistics",
    status: "available",
  },
];

export default function VolunteersView() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>(VOLUNTEERS);

  const assign = (id: number): void => {
    setVolunteers((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, status: "assigned" as const } : v
      )
    );
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Volunteer Coordination</span>
      </div>

      {volunteers.map((v) => (
        <div
          key={v.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {v.name}
            </div>

            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-secondary)",
              }}
            >
              {v.skill} &middot; {v.area}
            </div>
          </div>

          {v.status === "available" ? (
            <button
              onClick={() => assign(v.id)}
              className="btn btn-approve"
              style={{
                width: "auto",
                padding: "6px 14px",
              }}
            >
              Assign
            </button>
          ) : (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "12px",
                color: "var(--success)",
                fontWeight: 600,
              }}
            >
              <UserCheck size={14} />
              Assigned
            </span>
          )}
        </div>
      ))}
    </div>
  );
}