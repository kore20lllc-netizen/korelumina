import type {
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaExecutiveRibbonProps {
  identity: ReactNode;
  operations: ReactNode;
  metrics: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function LuminaExecutiveRibbon({
  identity,
  operations,
  metrics,
  className,
  contentClassName,
}: LuminaExecutiveRibbonProps) {
  return (
    <header
      className={cn(
        "group relative h-full min-w-0 overflow-hidden",
        "rounded-[30px]",
        "border border-white/[0.08]",
        "bg-[linear-gradient(145deg,rgba(15,23,42,.78),rgba(15,23,42,.58))]",
        "shadow-[0_28px_160px_rgba(0,0,0,.40)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0",
          "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.10),transparent_36%),radial-gradient(circle_at_top_right,rgba(139,92,246,.11),transparent_40%),linear-gradient(180deg,rgba(255,255,255,.02),transparent_34%)]",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div
        className={cn(
          "relative z-10 flex h-full min-w-0 flex-col px-8 py-9",
          contentClassName,
        )}
      >
        <div className="min-w-0">
          {identity}
        </div>

        <div className="mt-7 min-w-0">
          {operations}
        </div>

        <div className="mt-7 min-w-0">
          {metrics}
        </div>
      </div>
    </header>
  );
}
