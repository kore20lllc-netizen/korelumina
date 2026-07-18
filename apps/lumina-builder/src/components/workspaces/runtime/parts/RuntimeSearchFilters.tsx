import { forwardRef, useId } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
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
  { value: "all", label: "All envs" },
  { value: "production", label: "Production", dotClassName: "bg-violet" },
  { value: "staging", label: "Staging", dotClassName: "bg-cyan" },
  { value: "preview", label: "Preview", dotClassName: "bg-rose" },
];

const HEALTH_OPTIONS: LuminaSegmentOption<HealthStatus | "all">[] = [
  { value: "all", label: "All" },
  { value: "healthy", label: "Healthy", dotClassName: "bg-cyan" },
  { value: "degraded", label: "Degraded", dotClassName: "bg-gold" },
  { value: "critical", label: "Critical", dotClassName: "bg-magenta" },
  { value: "offline", label: "Offline", dotClassName: "bg-muted-foreground" },
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
      query,
      onQuery,
      env,
      onEnv,
      health,
      onHealth,
      className,
    },
    ref,
  ) => {
    const id = useId();

    return (
      <div
        className={cn(
          "flex flex-col gap-6",
          "xl:flex-row xl:items-end xl:justify-between",
          className,
        )}
      >
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Search
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              ref={ref}
              id={id}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search runtime services..."
              className="h-12 rounded-xl pl-10 pr-14"
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

        <div
          className={cn(
            "grid gap-5",
            "sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]",
            "xl:flex-shrink-0",
          )}
        >
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Environment
            </div>

            <LuminaSegmentedControl
            aria-label="Environment"
            value={env}
            options={ENV_OPTIONS}
            onValueChange={onEnv}
          />

          </div>

          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Health
            </div>

            <LuminaSegmentedControl
            aria-label="Health"
            value={health}
            options={HEALTH_OPTIONS}
            onValueChange={onHealth}
          />
          </div>
        </div>
      </div>
    );
  },
);

RuntimeSearchFilters.displayName = "RuntimeSearchFilters";
