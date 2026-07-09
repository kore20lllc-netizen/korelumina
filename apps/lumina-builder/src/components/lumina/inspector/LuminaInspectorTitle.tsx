import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaInspectorTitleProps {
  children: ReactNode;
  className?: string;
}

export function LuminaInspectorTitle({
  children,
  className,
}: LuminaInspectorTitleProps) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </h2>
  );
}
