import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaWorkspacePanel } from "../LuminaWorkspacePanel";

export interface LuminaTimelineCardProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function LuminaTimelineCard({
  icon,
  title,
  subtitle,
  children,
  className,
}: LuminaTimelineCardProps) {
  return (
    <LuminaWorkspacePanel
      className={cn(
        "overflow-hidden",
        className,
      )}
    >
      <div className="flex gap-4 p-4">
        {icon && (
          <div className="shrink-0">
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tight">
            {title}
          </div>

          {subtitle && (
            <div className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}

          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default LuminaTimelineCard;
