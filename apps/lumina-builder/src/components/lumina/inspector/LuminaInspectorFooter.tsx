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
        "border-t border-white/10",
        "px-5 py-4",
        className,
      )}
    >
      {children}
    </footer>
  );
}
