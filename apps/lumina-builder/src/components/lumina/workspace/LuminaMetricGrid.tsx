import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export interface LuminaMetricGridProps
  extends PropsWithChildren {
  className?: string;
}

export function LuminaMetricGrid({
  children,
  className,
}: LuminaMetricGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default LuminaMetricGrid;
