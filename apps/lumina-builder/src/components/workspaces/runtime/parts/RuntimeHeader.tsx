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
  Search,
  X,
} from "lucide-react";

import {
  Input,
} from "@/components/ui/input";

import {
  LuminaWorkspaceHero,
} from "@/components/lumina/workspace";

import {
  RuntimeMetricTile,
} from "./RuntimeMetricTile";

import {
  LuminaBrand,
} from "@/components/lumina/brand";

import {
  workspaceAccents,
} from "@/components/lumina/tokens/workspaceAccents";

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

const runtimeAccent =
  workspaceAccents.runtime;

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
  degraded: "text-gold",
  critical: "text-rose",
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
).toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

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


    const searchControl = (
      <div className="mt-8 max-w-2xl">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Search
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            ref={ref}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search runtime services..."
            className={[
              "h-12",
              "rounded-full",
              "pl-10",
              "pr-14",
              "border",
              "border-white/15",
              "bg-white/[0.08]",
              "backdrop-blur-2xl",
              "shadow-[0_12px_40px_rgba(0,0,0,0.18),inset_0_1px_rgba(255,255,255,0.10)]",
              "focus-visible:border-white/25",
              "focus-visible:ring-2",
              "focus-visible:ring-violet-400/30",
            ].join(" ")}
          />

          {query && (
            <button
              type="button"
              onClick={() => onQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 [&:hover]:[background:var(--lumina-surface-interactive)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );

    return (
      <LuminaWorkspaceHero
        presentation="executive"
        eyebrow={null}
        title={
          <div className="flex flex-col">
            <LuminaBrand
              size="hero"
              className="text-5xl"
            />

            <h2
              className={[
                "mt-4 text-[2.75rem] font-bold leading-none tracking-[-0.04em]",
                runtimeAccent.text,
              ].join(" ")}
            >
              Runtime Operations
            </h2>

            <div className="mt-5 text-[13px] font-semibold uppercase tracking-[0.30em] text-gold/80">
              Observe • Operate • Recover
            </div>

            {searchControl}
          </div>
        }
        subtitle="Monitor services, inspect health, review logs, and control deployments from a unified runtime dashboard."
        metrics={
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[34rem]">
            <RuntimeMetricTile
              label="Active Services"
              icon={
                <div className="relative">
                  <Cpu className="h-5 w-5 text-cyan" />

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
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none tracking-[-0.04em] tabular-nums">
                    {overall.running}
                  </span>

                  <span className="pb-1.5 text-lg font-medium text-muted-foreground">
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

            <RuntimeMetricTile
              label="Updated"
              icon={
                <Clock3 className="h-5 w-5 text-violet" />
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

            <RuntimeMetricTile
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

            <RuntimeMetricTile
              label="Average CPU"
              icon={
                <Activity className="h-5 w-5 text-gold" />
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
          </div>
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
