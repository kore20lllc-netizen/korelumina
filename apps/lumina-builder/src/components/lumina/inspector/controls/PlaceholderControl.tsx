import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PlaceholderControlProps {
  children: ReactNode;
  className?: string;
}

export function PlaceholderControl({
  children,
  className,
}: PlaceholderControlProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PlaceholderControl;
