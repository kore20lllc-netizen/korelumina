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
        "grid items-stretch gap-4 lg:gap-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default LuminaMetricGrid;
