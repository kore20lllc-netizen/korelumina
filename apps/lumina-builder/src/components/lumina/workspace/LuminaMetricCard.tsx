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
      className={cn("min-h-[148px]", className)}
    >
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>

          {icon}
        </div>

        <div className="mt-4 flex-1">
          <div className="text-3xl font-semibold tracking-tight">
            {value}
          </div>

          {accent && (
            <div className="mt-3">
              {accent}
            </div>
          )}
        </div>

        {footer && (
          <div className="pt-4">
            {footer}
          </div>
        )}
      </div>
    </LuminaWorkspacePanel>
  );
}

export default LuminaMetricCard;
