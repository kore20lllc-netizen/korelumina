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
        <div className="space-y-2 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>

          <div className="font-display text-4xl font-semibold tracking-tight text-white">
            {value}
          </div>

          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            {icon}
          </div>
        )}
      </div>
    </WorkspaceCard>
  );
}

export default WorkspaceMetricCard;
