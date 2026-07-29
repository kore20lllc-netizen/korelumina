import {
  LuminaBadge,
} from "@/components/lumina/workspace";

import { RuntimeStatusDot } from "./RuntimeStatusDot";

import type {
  HealthStatus,
} from "@/services/runtime/types";

const LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  critical: "Critical",
  offline: "Offline",
};

const VARIANT: Record<
  HealthStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  healthy: "success",
  degraded: "warning",
  critical: "danger",
  offline: "default",
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
    <LuminaBadge
      variant={VARIANT[status]}
      className={className}
      aria-label={`Health: ${LABEL[status]}${
        typeof score === "number" ? ` ${score}%` : ""
      }`}
    >
      <RuntimeStatusDot
        status={status}
        className="mr-2 h-2 w-2 ring-0"
      />

      <span>{LABEL[status]}</span>

      {typeof score === "number" && (
        <>
          <span
            aria-hidden
            className="mx-2 h-4 w-px bg-current/25"
          />

          <span className="font-display tabular-nums text-[12px] tracking-tight">
            {score}%
          </span>
        </>
      )}
    </LuminaBadge>
  );
}

export default RuntimeHealthBadge;
