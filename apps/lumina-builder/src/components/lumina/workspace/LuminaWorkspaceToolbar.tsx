import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaWorkspaceToolbarProps {
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceToolbar({
  leading,
  trailing,
  className,
}: LuminaWorkspaceToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-3xl",
        "border",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        "px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        {leading}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {trailing}
      </div>
    </div>
  );
}

export default LuminaWorkspaceToolbar;
