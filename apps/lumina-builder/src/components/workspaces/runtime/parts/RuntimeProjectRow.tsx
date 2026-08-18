import {
  forwardRef,
} from "react";

import {
  LuminaBadge,
  LuminaServiceCard,
} from "@/components/lumina/workspace";

import {
  cn,
} from "@/lib/utils";

import type {
  RuntimeProject,
} from "@/services/runtime/types";

import {
  RuntimeSparkline,
} from "./RuntimeSparkline";

import {
  RuntimeStatusDot,
} from "./RuntimeStatusDot";

export interface RuntimeProjectRowProps {
  project: RuntimeProject;
  selected?: boolean;
  onSelect?: () => void;
  tabIndex?: number;
  onKeyDown?: (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  className?: string;
}

const ENVIRONMENT_CLASS: Record<
  RuntimeProject["env"],
  string
> = {
  production: [
    "border",
    "[border-color:hsl(var(--cyan)/0.34)]",
    "[background:hsl(var(--cyan)/0.12)]",
    "text-cyan",
  ].join(" "),

  staging: [
    "border",
    "[border-color:hsl(var(--gold)/0.34)]",
    "[background:hsl(var(--gold)/0.12)]",
    "text-gold",
  ].join(" "),

  preview: [
    "border",
    "[border-color:hsl(var(--violet)/0.34)]",
    "[background:hsl(var(--violet)/0.12)]",
    "text-violet-200",
  ].join(" "),
};

const STATE_LABEL: Record<
  RuntimeProject["state"],
  string
> = {
  running: "Running",
  idle: "Idle",
  starting: "Starting",
  restarting: "Restarting",
  stopped: "Stopped",
  error: "Error",
};

function formatUptime(
  uptimeMs: number,
): string {
  if (
    !Number.isFinite(
      uptimeMs,
    ) ||
    uptimeMs <= 0
  ) {
    return "—";
  }

  const totalMinutes =
    Math.floor(
      uptimeMs / 60_000,
    );

  const days =
    Math.floor(
      totalMinutes / 1_440,
    );

  const hours =
    Math.floor(
      (totalMinutes % 1_440) /
        60,
    );

  const minutes =
    totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatMetric(
  value: number,
  suffix: string,
  decimals = 0,
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(decimals)}${suffix}`;
}

interface MetricProps {
  label: string;
  value: string;
}

function RuntimeCardMetric({
  label,
  value,
}: MetricProps) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[8.5px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>

      <div className="mt-0.5 truncate text-xs font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

export const RuntimeProjectRow = forwardRef<
  HTMLButtonElement,
  RuntimeProjectRowProps
>(
  (
    {
      project,
      selected = false,
      onSelect,
      tabIndex,
      onKeyDown,
      className,
    },
    ref,
  ) => {
    const memoryLabel =
      Number.isFinite(
        project.metrics.memUsedMb,
      )
        ? `${project.metrics.memUsedMb.toFixed(0)} MB`
        : "—";

    return (
      <LuminaServiceCard
        ref={ref}
        selected={selected}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        aria-pressed={selected}
        aria-label={[
          project.name,
          project.env,
          STATE_LABEL[project.state],
          `health ${project.health.status}`,
          `CPU ${project.metrics.cpuPct.toFixed(0)} percent`,
        ].join(", ")}
        title={project.name}
        subtitle={
          <span className="tabular-nums">
            {project.version}
            {" • "}
            {project.region}
          </span>
        }
        badge={
          <LuminaBadge
            className={
              ENVIRONMENT_CLASS[
                project.env
              ]
            }
          >
            {project.env}
          </LuminaBadge>
        }
        className={cn(
          "shrink-0",
          "[&>button]:gap-3",
          "[&>button]:p-3.5",
          className,
        )}
        status={
          <div className="flex min-w-0 items-center gap-2">
            <RuntimeStatusDot
              status={
                project.health.status
              }
              className="h-2.5 w-2.5 shrink-0"
            />

            <span className="truncate text-xs font-medium text-foreground">
              {STATE_LABEL[project.state]}
            </span>

            <span
              aria-hidden="true"
              className="shrink-0 text-muted-foreground/60"
            >
              •
            </span>

            <span className="truncate text-[11px] capitalize text-muted-foreground">
              {project.health.status}
            </span>
          </div>
        }
        sparkline={
          <div
            className={cn(
              "overflow-hidden border px-2 py-1",
              "[border-radius:var(--lumina-radius-inner)]",
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-compact)]",
            )}
          >
            <RuntimeSparkline
              data={
                project.metrics.cpuSeries
              }
              secondaryData={
                project.metrics.memSeries
              }
              mode="service"
              width={260}
              height={44}
              stroke="hsl(var(--cyan))"
              secondaryStroke="hsl(var(--magenta))"
              fill="hsl(var(--cyan) / 0.10)"
              label={`${project.name} CPU and memory telemetry`}
            />
          </div>
        }
        metrics={
          <div className="grid grid-cols-3 gap-x-3 gap-y-3">
            <RuntimeCardMetric
              label="CPU"
              value={formatMetric(
                project.metrics.cpuPct,
                "%",
              )}
            />

            <RuntimeCardMetric
              label="Memory"
              value={memoryLabel}
            />

            <RuntimeCardMetric
              label="RPS"
              value={formatMetric(
                project.metrics.rps,
                "",
                1,
              )}
            />

            <RuntimeCardMetric
              label="P95"
              value={formatMetric(
                project.metrics.p95Ms,
                " ms",
              )}
            />

            <RuntimeCardMetric
              label="Errors"
              value={formatMetric(
                project.metrics.errorRatePct,
                "%",
                1,
              )}
            />

            <RuntimeCardMetric
              label="Uptime"
              value={formatUptime(
                project.uptimeMs,
              )}
            />
          </div>
        }
      />
    );
  },
);

RuntimeProjectRow.displayName =
  "RuntimeProjectRow";
