import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaInspectorHeaderProps {
  children: ReactNode;
  className?: string;
}

export function LuminaInspectorHeader({
  children,
  className,
}: LuminaInspectorHeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-white/10",
        "px-5 py-5",
        "space-y-2",
        className,
      )}
    >
      {children}
    </header>
  );
}
