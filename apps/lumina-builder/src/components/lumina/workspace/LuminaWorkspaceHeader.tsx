import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaWorkspaceHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: LuminaWorkspaceHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div
              className={cn(
                "mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1",
                "text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground",
                "[border-color:var(--lumina-border-standard)]",
                "[background:var(--lumina-surface-interactive)]",
              )}
            >
              {eyebrow}
            </div>
          )}

          <h1 className="text-3xl font-semibold tracking-tight">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="shrink-0">
            {actions}
          </div>
        )}
      </div>

      <div
        className={cn(
          "border-t px-7 py-5",
          "[border-color:var(--lumina-border-standard)]",
        )}
      />
    </header>
  );
}

export default LuminaWorkspaceHeader;
