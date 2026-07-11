import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaInspectorHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function LuminaInspectorHeader({
  title,
  actions,
  className,
}: LuminaInspectorHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3",
        "border-b",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-panel)]",
        "px-5 py-4",
        className,
      )}
    >
      <h2 className="text-sm font-semibold tracking-wide">
        {title}
      </h2>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

export default LuminaInspectorHeader;
