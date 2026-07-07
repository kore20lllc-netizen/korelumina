import { cn } from "@/lib/utils";
import { RuntimeStatusDot } from "./RuntimeStatusDot";
import type { HealthStatus } from "@/services/runtime/types";

const LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  critical: "Critical",
  offline: "Offline",
};

const CHIP: Record<HealthStatus, string> = {
  healthy:
    "border border-cyan/30 bg-[linear-gradient(180deg,rgba(34,211,238,.22),rgba(34,211,238,.08))] text-cyan-100 shadow-[0_10px_32px_-12px_rgba(34,211,238,.60),inset_0_1px_0_rgba(255,255,255,.18)]",

  degraded:
    "border border-amber-400/30 bg-[linear-gradient(180deg,rgba(251,191,36,.22),rgba(251,191,36,.08))] text-amber-100 shadow-[0_10px_32px_-12px_rgba(251,191,36,.60),inset_0_1px_0_rgba(255,255,255,.18)]",

  critical:
    "border border-rose-400/30 bg-[linear-gradient(180deg,rgba(244,63,94,.22),rgba(244,63,94,.08))] text-rose-100 shadow-[0_10px_34px_-12px_rgba(244,63,94,.65),inset_0_1px_0_rgba(255,255,255,.18)]",

  offline:
    "border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
};

export function RuntimeHealthBadge({
  status,
  score,
  className,
}: {
  status: HealthStatus;
  score?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        "h-9 rounded-xl px-3.5",
        "backdrop-blur-xl",
        "font-medium",
        "text-[11px]",
        "uppercase tracking-[0.16em]",
        "transition-all duration-200",
        CHIP[status],
        className,
      )}
      aria-label={`Health: ${LABEL[status]}${typeof score === "number" ? ` ${score}%` : ""}`}
    >
      <RuntimeStatusDot
        status={status}
        className="h-2 w-2 ring-0"
      />

      <span>{LABEL[status]}</span>

      {typeof score === "number" && (
        <>
          <span
            aria-hidden
            className="h-4 w-px bg-current/25"
          />

          <span className="font-display tabular-nums text-[12px] tracking-tight">
            {score}%
          </span>
        </>
      )}
    </span>
  );
}
