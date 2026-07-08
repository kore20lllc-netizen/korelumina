import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaWorkspacePanel } from "./LuminaWorkspacePanel";

export interface LuminaWorkspaceHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  metrics,
  className,
}: LuminaWorkspaceHeaderProps) {
  return (
    <LuminaWorkspacePanel
      className={cn(
        "relative min-h-[180px]",
        className,
      )}
    >
      <div className="relative flex flex-col gap-6 p-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </div>
          )}

          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {metrics && (
        <div className="border-t border-white/8 px-7 py-5">
          {metrics}
        </div>
      )}
    </LuminaWorkspacePanel>
  );
}

export default LuminaWorkspaceHeader;
