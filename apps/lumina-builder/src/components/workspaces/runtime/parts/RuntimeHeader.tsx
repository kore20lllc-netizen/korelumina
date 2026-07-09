import { forwardRef } from "react";
import { Activity, Cpu } from "lucide-react";

import {
  LuminaMetricCard,
  LuminaWorkspaceHero,
} from "@/components/lumina/workspace";

import { RuntimeSearchFilters } from "./RuntimeSearchFilters";

import type {
  Environment,
  HealthStatus,
  RuntimeOverview,
} from "@/services/runtime/types";

interface RuntimeHeaderProps {
  overall: RuntimeOverview;
  updatedAt: number;
  query: string;
  onQuery: (value: string) => void;
  env: Environment | "all";
  onEnv: (value: Environment | "all") => void;
  health: HealthStatus | "all";
  onHealth: (value: HealthStatus | "all") => void;
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
    const updatedLabel =
      new Date(updatedAt).toLocaleTimeString(
        [],
        {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        },
      );

    return (
      <LuminaWorkspaceHero
        eyebrow={
          <>
            <Activity className="h-3.5 w-3.5" />
            Runtime Operations
          </>
        }
        title="Runtime Control Center"
        subtitle="Monitor services, inspect health, review logs, and control deployments from a unified runtime dashboard."
        metrics={
          <div className="flex flex-wrap items-center gap-4">
            <LuminaMetricCard label="Active Services">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-300" />

                <span className="text-3xl font-semibold">
                  {overall.running}
                </span>

                <span className="text-muted-foreground">
                  / {overall.total}
                </span>
              </div>
            </LuminaMetricCard>

            <LuminaMetricCard label="Updated">
              <div className="text-sm font-medium tabular-nums">
                {updatedLabel}
              </div>
            </LuminaMetricCard>
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
