import { forwardRef } from "react";
import { Activity, Cpu } from "lucide-react";

import {
  LuminaMetricCard,
  LuminaWorkspaceHero,
} from "@/components/lumina/workspace";
import { LuminaBrand } from "@/components/lumina/brand";

import { workspaceAccents } from "@/components/lumina/tokens/workspaceAccents";

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

const runtimeAccent =
  workspaceAccents.runtime;

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
        eyebrow={null}
        title={
          <div className="flex flex-col">
            <LuminaBrand
              size="hero"
              className="text-5xl"
            />

            <h2
              className={`mt-3 text-4xl font-bold tracking-tight ${runtimeAccent.text}`}
            >
              Runtime Operations
            </h2>

            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.42em] text-muted-foreground">
              Observe • Operate • Recover
            </div>
          </div>
        }
        subtitle="Monitor services, inspect health, review logs, and control deployments from a unified runtime dashboard."
        metrics={
          <div className="flex flex-wrap gap-4">
            <LuminaMetricCard label="Active Services">
              <div className="flex items-center gap-3">
                <Cpu className="h-6 w-6 text-cyan-300" />

                <div className="text-4xl font-bold tabular-nums">
                  {overall.running}
                </div>

                <div className="self-end pb-1 text-muted-foreground">
                  / {overall.total}
                </div>
              </div>
            </LuminaMetricCard>

            <LuminaMetricCard label="Updated">
              <div className="text-lg font-medium tabular-nums">
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
