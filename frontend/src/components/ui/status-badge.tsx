import * as React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "online" | "dispatching" | "critical" | "standby" | "neutral";
  label: string;
  count?: number | string;
  pulse?: boolean;
}

const statusConfig = {
  online: {
    bg: "bg-emerald-950/70 border-emerald-800 text-emerald-300",
    dot: "bg-emerald-500",
    ping: "bg-emerald-400",
  },
  dispatching: {
    bg: "bg-sky-950/70 border-sky-800 text-sky-300",
    dot: "bg-sky-500",
    ping: "bg-sky-400",
  },
  critical: {
    bg: "bg-red-950/70 border-red-800 text-red-300",
    dot: "bg-red-500",
    ping: "bg-red-400",
  },
  standby: {
    bg: "bg-amber-950/70 border-amber-800 text-amber-300",
    dot: "bg-amber-500",
    ping: "bg-amber-400",
  },
  neutral: {
    bg: "bg-slate-900 border-slate-700 text-slate-300",
    dot: "bg-slate-500",
    ping: "bg-slate-400",
  },
};

export function StatusBadge({
  status = "online",
  label,
  count,
  pulse = true,
  className,
  ...props
}: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig.neutral;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border select-none",
        cfg.bg,
        className
      )}
      {...props}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              cfg.ping
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", cfg.dot)} />
      </span>
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono">
          {count}
        </span>
      )}
    </div>
  );
}
