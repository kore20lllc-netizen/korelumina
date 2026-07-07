import { forwardRef } from "react";
import { Activity, Cpu } from "lucide-react";

import { GlowCard } from "@/components/lumina/GlowCard";
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
    const updatedLabel = new Date(updatedAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });

    return (
      <GlowCard className="relative overflow-hidden p-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet/15 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan/10 blur-3xl" />

        <div className="relative space-y-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet/25 bg-violet/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">
                <Activity className="h-3.5 w-3.5" />
                Runtime Operations
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                Runtime Control Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Monitor services, inspect health, review logs, and control
                deployments from a unified runtime dashboard.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
                <div className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground">
                  Active Services
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-cyan-300" />
                  <span className="text-3xl font-semibold">
                    {overall.running}
                  </span>
                  <span className="text-muted-foreground">
                    / {overall.total}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
                <div className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground">
                  Updated
                </div>

                <div className="mt-2 text-sm font-medium tabular-nums">
                  {updatedLabel}
                </div>
              </div>
            </div>
          </div>

          <RuntimeSearchFilters
            ref={ref}
            query={query}
            onQuery={onQuery}
            env={env}
            onEnv={onEnv}
            health={health}
            onHealth={onHealth}
          />
        </div>
      </GlowCard>
    );
  },
);

RuntimeHeader.displayName = "RuntimeHeader";
