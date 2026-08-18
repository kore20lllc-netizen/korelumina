import type {
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaExecutiveMetricGridProps {
  children: ReactNode;
  className?: string;
}

export function LuminaExecutiveMetricGrid({
  children,
  className,
}: LuminaExecutiveMetricGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
