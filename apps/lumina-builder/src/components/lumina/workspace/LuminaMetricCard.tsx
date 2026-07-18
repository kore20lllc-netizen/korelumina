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
      className={cn("min-h-[168px]", className)}
    >
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {label}
          </div>

          {icon}
        </div>

        <div className="mt-6 flex-1">
          <div className="text-3xl font-bold tracking-tight">
            {value}
          </div>

          {accent && (
            <div className="mt-4">
              {accent}
            </div>
          )}
        </div>

        {footer && (
          <div className="border-t pt-4 [border-color:var(--lumina-border-standard)]">
            {footer}
          </div>
        )}
      </div>
    </LuminaWorkspacePanel>
  );
}

export default LuminaMetricCard;
