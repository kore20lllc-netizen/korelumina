import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaInspectorFooterProps {
  children: ReactNode;
  className?: string;
}

export function LuminaInspectorFooter({
  children,
  className,
}: LuminaInspectorFooterProps) {
  return (
    <footer
      className={cn(
        "border-t",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-panel)]",
        "px-5 py-4",
        className,
      )}
    >
      {children}
    </footer>
  );
}

export default LuminaInspectorFooter;
