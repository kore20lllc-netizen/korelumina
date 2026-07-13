import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaInspectorBodyProps {
  children: ReactNode;
  className?: string;
}

export function LuminaInspectorBody({
  children,
  className,
}: LuminaInspectorBodyProps) {
  return (
    <div
      className={cn(
        "flex-1",
        "overflow-y-auto",
        "px-5 py-5",
        "space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
