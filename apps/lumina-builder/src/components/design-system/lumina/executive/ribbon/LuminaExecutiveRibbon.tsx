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
        "border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20",
        "bg-slate-950/48 backdrop-blur-[44px] backdrop-saturate-[170%]",
        "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_2%,rgba(124,58,237,.30),transparent_36%),radial-gradient(circle_at_29%_42%,rgba(217,119,6,.17),transparent_27%),radial-gradient(circle_at_74%_64%,rgba(67,56,202,.13),transparent_30%),radial-gradient(circle_at_91%_14%,rgba(34,211,238,.035),transparent_22%),radial-gradient(circle_at_57%_86%,rgba(236,72,153,.075),transparent_18%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_24%,rgba(2,6,23,.10))]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)] [box-shadow:0_0_22px_rgba(125,211,252,.14),0_0_40px_rgba(247,215,116,.08)]"
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
