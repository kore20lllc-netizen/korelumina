import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  WorkspaceCard,
} from "./WorkspaceCard";

interface WorkspaceMetricCardProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export function WorkspaceMetricCard({
  label,
  value,
  subtitle,
  icon,
  className,
}: WorkspaceMetricCardProps) {
  return (
    <WorkspaceCard
      className={cn(
        "p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>

          <div className="font-display text-4xl font-semibold tracking-tight">
            {value}
          </div>

          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              [border-radius:var(--lumina-radius-inner)]
              border
              [border-color:var(--lumina-border-standard)]
              [background:var(--lumina-surface-interactive)]
            "
          >
            {icon}
          </div>
        )}
      </div>
    </WorkspaceCard>
  );
}

export default WorkspaceMetricCard;
