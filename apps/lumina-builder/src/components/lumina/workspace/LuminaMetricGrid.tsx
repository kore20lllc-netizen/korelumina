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
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch gap-4 lg:gap-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default LuminaMetricGrid;
