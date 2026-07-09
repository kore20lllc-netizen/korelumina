import { forwardRef } from "react";

import {
  LuminaBadge,
  LuminaFeedCard,
} from "@/components/lumina/workspace";

import { cn } from "@/lib/utils";

import { RuntimeSparkline } from "./RuntimeSparkline";
import { RuntimeStatusDot } from "./RuntimeStatusDot";

import type { RuntimeProject } from "@/services/runtime/types";

export interface RuntimeProjectRowProps {
  project: RuntimeProject;
  selected?: boolean;
  onSelect?: () => void;
  tabIndex?: number;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  className?: string;
}

const ENV_CHIP: Record<string, string> = {
  production:
    "border border-violet/30 bg-[linear-gradient(180deg,rgba(124,92,255,.28),rgba(124,92,255,.10))] text-violet-100 shadow-[0_0_22px_rgba(124,92,255,.28)]",

  staging:
    "border border-cyan/30 bg-[linear-gradient(180deg,rgba(34,211,238,.26),rgba(34,211,238,.08))] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.24)]",

  preview:
    "border border-rose/30 bg-[linear-gradient(180deg,rgba(244,63,94,.24),rgba(244,63,94,.08))] text-rose-100 shadow-[0_0_22px_rgba(244,63,94,.22)]",
};

const STATE_LABEL: Record<string, string> = {
  running: "Running",
  idle: "Idle",
  starting: "Starting",
  restarting: "Restarting",
  stopped: "Stopped",
  error: "Error",
};

export const RuntimeProjectRow = forwardRef<
  HTMLButtonElement,
  RuntimeProjectRowProps
>(
  (
    {
      project: p,
      selected,
      onSelect,
      tabIndex,
      onKeyDown,
      className,
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        aria-pressed={selected}
        aria-label={`${p.name}, ${p.env}, ${STATE_LABEL[p.state]}, health ${p.health.status}`}
        className={cn(
          "group relative overflow-hidden w-full rounded-2xl",
          "border backdrop-blur-xl",
          "text-left",
          "transition-all duration-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/60",

          selected
            ? [
                "border-violet/30",
                "bg-[linear-gradient(180deg,rgba(124,92,255,.12),rgba(255,255,255,.03))]",
                "shadow-[0_20px_50px_-24px_rgba(124,92,255,.55),inset_0_1px_0_rgba(255,255,255,.08)]",
                "-translate-y-[2px]",
              ]
            : [
                "border-white/8",
                "bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))]",
                "hover:border-violet/18",
                "hover:-translate-y-[2px]",
                "hover:shadow-[0_18px_42px_-24px_rgba(0,0,0,.65)]",
              ],

          className,
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <LuminaFeedCard className="border-0 bg-transparent shadow-none">
          <div className="flex items-center gap-4 p-4">
          <RuntimeStatusDot
            status={p.health.status}
            className="h-2.5 w-2.5"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="truncate text-[14px] font-semibold tracking-tight text-foreground">
                {p.name}
              </h3>

              <LuminaBadge
                className={ENV_CHIP[p.env]}
              >
                {p.env}
              </LuminaBadge>
            </div>

            <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
              {STATE_LABEL[p.state]}
              {" • "}
              {p.version}
              {" • "}
              {p.region}
            </div>
          </div>

          <div className="hidden sm:block">
            <RuntimeSparkline
              data={p.metrics.cpuSeries.slice(-30)}
              width={96}
              height={28}
              stroke="hsl(var(--cyan))"
              fill="hsl(var(--cyan) / 0.14)"
            />
          </div>

          <div className="hidden md:flex min-w-[72px] flex-col items-end">
            <div className="text-[16px] font-semibold tabular-nums">
              {p.metrics.cpuPct.toFixed(0)}%
            </div>

            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              CPU
            </div>
          </div>
          </div>
        </LuminaFeedCard>
      </button>
    );
  },
);

RuntimeProjectRow.displayName =
  "RuntimeProjectRow";
