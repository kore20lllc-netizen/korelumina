import {
  forwardRef,
  useEffect,
  useState,
} from "react";

import {
  Activity,
  Clock3,
  Cpu,
  HeartPulse,
} from "lucide-react";

import {
  LuminaMetricCard,
  LuminaMetricGrid,
  LuminaWorkspaceBrand,
  LuminaWorkspaceHero,
} from "@/components/lumina/workspace";

import type {
  Environment,
  HealthStatus,
  RuntimeOverview,
} from "@/services/runtime/types";

import {
  RuntimeSearchFilters,
} from "./RuntimeSearchFilters";

interface RuntimeHeaderProps {
  overall: RuntimeOverview;
  updatedAt: number;
  query: string;
  onQuery: (value: string) => void;
  env: Environment | "all";
  onEnv: (
    value: Environment | "all",
  ) => void;
  health: HealthStatus | "all";
  onHealth: (
    value: HealthStatus | "all",
  ) => void;
}

const HEALTH_LABEL: Record<
  HealthStatus,
  string
> = {
  healthy: "Healthy",
  degraded: "Degraded",
  critical: "Critical",
  offline: "Offline",
};

const HEALTH_TEXT_CLASS: Record<
  HealthStatus,
  string
> = {
  healthy: "text-emerald-300",
  degraded: "text-amber-300",
  critical: "text-rose-300",
  offline: "text-muted-foreground",
};

const HEALTH_DOT_CLASS: Record<
  HealthStatus,
  string
> = {
  healthy: [
    "bg-emerald-400",
    "shadow-[0_0_16px_rgba(52,211,153,0.72)]",
  ].join(" "),

  degraded: [
    "bg-amber-400",
    "shadow-[0_0_16px_rgba(251,191,36,0.68)]",
  ].join(" "),

  critical: [
    "bg-rose-400",
    "shadow-[0_0_16px_rgba(251,113,133,0.72)]",
  ].join(" "),

  offline:
    "bg-muted-foreground/50",
};

function formatUpdatedTime(
  timestamp: number,
): string {
  if (
    !Number.isFinite(timestamp) ||
    timestamp <= 0
  ) {
    return "—";
  }

  return new Date(
    timestamp,
  ).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}

function formatRelativeTime(
  timestamp: number,
  now: number,
): string {
  if (
    !Number.isFinite(timestamp) ||
    timestamp <= 0
  ) {
    return "Unavailable";
  }

  const elapsedMs =
    Math.max(
      0,
      now - timestamp,
    );

  const seconds =
    Math.floor(
      elapsedMs / 1_000,
    );

  if (seconds < 2) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds} sec ago`;
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  return `${hours} hr ago`;
}

function formatCpu(
  value: number,
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (
    value > 0 &&
    value < 1
  ) {
    return `${value.toFixed(1)}%`;
  }

  return `${value.toFixed(0)}%`;
}

export const RuntimeHeader = forwardRef<
  HTMLInputElement,
  RuntimeHeaderProps
>(
  (
    {
      overall,
      updatedAt,
      query,
      onQuery,
      env,
      onEnv,
      health,
      onHealth,
    },
    ref,
  ) => {
    const [
      now,
      setNow,
    ] = useState(
      Date.now(),
    );

    useEffect(() => {
      const intervalId =
        window.setInterval(
          () => {
            setNow(
              Date.now(),
            );
          },
          1_000,
        );

      return () => {
        window.clearInterval(
          intervalId,
        );
      };
    }, []);

    const healthStatus =
      overall.health.status;

    const updatedLabel =
      formatUpdatedTime(
        updatedAt,
      );

    const relativeUpdatedLabel =
      formatRelativeTime(
        updatedAt,
        now,
      );

    return (
      <LuminaWorkspaceHero
        eyebrow={null}
        title={
          <LuminaWorkspaceBrand
            workspace="Runtime Operations"
            tagline="Observe • Operate • Recover"
          />
        }
        subtitle="Monitor services, inspect health, review logs, and control deployments from a unified runtime dashboard."
        metrics={
          <LuminaMetricGrid
            className="grid-cols-1 sm:grid-cols-2"
          >
            <LuminaMetricCard
              label="Active Services"
              icon={
                <div className="relative">
                  <Cpu className="h-5 w-5 text-cyan-300" />

                  {overall.running > 0 && (
                    <span
                      aria-hidden="true"
                      className={[
                        "absolute -right-1 -top-1",
                        "h-2 w-2 rounded-full",
                        "animate-pulse bg-emerald-400",
                        "shadow-[0_0_12px_rgba(52,211,153,0.72)]",
                      ].join(" ")}
                    />
                  )}
                </div>
              }
              value={
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold tabular-nums">
                    {overall.running}
                  </span>

                  <span className="pb-1 text-base font-medium text-muted-foreground">
                    / {overall.total}
                  </span>
                </div>
              }
              footer={
                <div className="text-[11px] text-muted-foreground">
                  {overall.running === 1
                    ? "1 service active"
                    : `${overall.running} services active`}
                </div>
              }
            />

            <LuminaMetricCard
              label="Updated"
              icon={
                <Clock3 className="h-5 w-5 text-violet-300" />
              }
              value={
                <div className="text-xl font-semibold tabular-nums">
                  {updatedLabel}
                </div>
              }
              footer={
                <div className="text-[11px] text-muted-foreground">
                  {relativeUpdatedLabel}
                </div>
              }
            />

            <LuminaMetricCard
              label="Runtime Health"
              icon={
                <HeartPulse
                  className={[
                    "h-5 w-5",
                    HEALTH_TEXT_CLASS[
                      healthStatus
                    ],
                  ].join(" ")}
                />
              }
              value={
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "text-xl font-semibold",
                      HEALTH_TEXT_CLASS[
                        healthStatus
                      ],
                    ].join(" ")}
                  >
                    {
                      HEALTH_LABEL[
                        healthStatus
                      ]
                    }
                  </span>

                  <span
                    aria-hidden="true"
                    className={[
                      "ml-auto h-2.5 w-2.5 rounded-full",
                      HEALTH_DOT_CLASS[
                        healthStatus
                      ],
                    ].join(" ")}
                  />
                </div>
              }
              footer={
                <div className="text-[11px] text-muted-foreground">
                  Health score{" "}
                  {overall.health.score}
                  /100
                </div>
              }
            />

            <LuminaMetricCard
              label="Average CPU"
              icon={
                <Activity className="h-5 w-5 text-amber-300" />
              }
              value={
                <div className="text-3xl font-bold tabular-nums">
                  {formatCpu(
                    overall.avgCpu,
                  )}
                </div>
              }
              footer={
                <div className="text-[11px] text-muted-foreground">
                  Across running services
                </div>
              }
            />
          </LuminaMetricGrid>
        }
      >
        <RuntimeSearchFilters
          ref={ref}
          query={query}
          onQuery={onQuery}
          env={env}
          onEnv={onEnv}
          health={health}
          onHealth={onHealth}
        />
      </LuminaWorkspaceHero>
    );
  },
);

RuntimeHeader.displayName =
  "RuntimeHeader";
