import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaWorkspacePanel } from "./LuminaWorkspacePanel";

export interface LuminaMetricCardProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  accent?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function LuminaMetricCard({
  label,
  value,
  icon,
  accent,
  footer,
  className,
}: LuminaMetricCardProps) {
  return (
    <LuminaWorkspacePanel
      className={cn(
        "relative min-h-[120px] overflow-hidden",
        className,
      )}
    >
      {/* premium glass highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />

      <div className="pointer-events-none absolute inset-x-5 top-0 h-12 rounded-full bg-white/[0.04] blur-2xl" />

      <div className="relative flex h-full flex-col px-4 py-3">

        <div className="flex items-start justify-between">

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/90">
              {label}
            </div>

            <div className="mt-3 flex min-h-[40px] items-center text-[30px] font-semibold leading-none tracking-[-0.03em] text-white">
              {value}
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05]">
            {icon}
          </div>
        </div>

        {accent && (
          <div className="mt-4">
            {accent}
          </div>
        )}

        {footer && (
          <div className="mt-auto pt-3">
            <div className="h-px bg-gradient-to-r from-white/15 via-white/6 to-transparent" />

            <div className="pt-3">
              {footer}
            </div>
          </div>
        )}
      </div>
    </LuminaWorkspacePanel>
  );
}

export default LuminaMetricCard;
