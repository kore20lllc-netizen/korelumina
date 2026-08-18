import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/services/runtime/types";

const MAP: Record<HealthStatus, { bg: string; ring: string; pulse: boolean }> = {
  healthy:  { bg: "bg-emerald-400", ring: "ring-emerald-400/30", pulse: false },
  degraded: { bg: "bg-gold",        ring: "ring-gold/30",        pulse: true  },
  critical: { bg: "bg-rose-500",    ring: "ring-rose-500/30",    pulse: true  },
  offline:  { bg: "bg-muted-foreground/50", ring: "ring-white/10", pulse: false },
};

export function RuntimeStatusDot({ status, className }: { status: HealthStatus; className?: string }) {
  const m = MAP[status];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-2 w-2 rounded-full ring-2",
        m.bg, m.ring, m.pulse && "animate-pulse",
        className,
      )}
    />
  );
}