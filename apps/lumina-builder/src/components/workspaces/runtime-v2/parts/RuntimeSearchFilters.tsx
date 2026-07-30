import { forwardRef } from "react";

import {
  LuminaSegmentedControl,
  type LuminaSegmentOption,
} from "@/components/lumina/LuminaSegmentedControl";

import { cn } from "@/lib/utils";

import type {
  Environment,
  HealthStatus,
} from "@/services/runtime/types";

const ENV_OPTIONS: LuminaSegmentOption<Environment | "all">[] = [
  {
    value: "all",
    label: "All envs",
  },
  {
    value: "production",
    label: "Production",
    dotClassName: "bg-violet",
  },
  {
    value: "staging",
    label: "Staging",
    dotClassName: "bg-cyan",
  },
  {
    value: "preview",
    label: "Preview",
    dotClassName: "bg-rose",
  },
];

const HEALTH_OPTIONS: LuminaSegmentOption<HealthStatus | "all">[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "healthy",
    label: "Healthy",
    dotClassName: "bg-cyan",
  },
  {
    value: "degraded",
    label: "Degraded",
    dotClassName: "bg-gold",
  },
  {
    value: "critical",
    label: "Critical",
    dotClassName: "bg-magenta",
  },
  {
    value: "offline",
    label: "Offline",
    dotClassName: "bg-muted-foreground",
  },
];

export interface RuntimeSearchFiltersProps {
  query: string;
  onQuery: (value: string) => void;
  env: Environment | "all";
  onEnv: (value: Environment | "all") => void;
  health: HealthStatus | "all";
  onHealth: (value: HealthStatus | "all") => void;
  className?: string;
}

export const RuntimeSearchFilters = forwardRef<
  HTMLInputElement,
  RuntimeSearchFiltersProps
>(
  (
    {
      env,
      onEnv,
      health,
      onHealth,
      className,
    },
    _ref,
  ) => (
    <section
      className={cn(
        "relative overflow-hidden rounded-[calc(var(--lumina-radius-surface)*1.05)]",
        "border",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-interactive)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] top-0 h-px [background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent)]"
      />

      <div className="relative px-7 py-6">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/80">
            Runtime Filters
          </div>

          <h3 className="text-xl font-semibold tracking-tight">
            Operational View
          </h3>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Filter the runtime fleet by operational health and
            deployment environment.
          </p>
        </div>

        <div className="mt-6 h-px [background:linear-gradient(90deg,rgba(255,255,255,.14),rgba(255,255,255,.05),transparent)]" />

        <div className="mt-7 grid gap-8 lg:grid-cols-2">
          <section className="min-w-0">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan">
              Health
            </div>

            <LuminaSegmentedControl
              variant="glass"
              aria-label="Health"
              className="w-full"
              value={health}
              options={HEALTH_OPTIONS}
              onValueChange={onHealth}
            />
          </section>

          <section className="min-w-0">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan">
              Environment
            </div>

            <LuminaSegmentedControl
              variant="glass"
              aria-label="Environment"
              className="w-full"
              value={env}
              options={ENV_OPTIONS}
              onValueChange={onEnv}
            />
          </section>
        </div>
      </div>
    </section>
  ),
);

RuntimeSearchFilters.displayName =
  "RuntimeSearchFilters";
