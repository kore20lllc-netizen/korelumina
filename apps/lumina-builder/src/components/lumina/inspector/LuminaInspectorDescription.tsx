import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaInspectorDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function LuminaInspectorDescription({
  children,
  className,
}: LuminaInspectorDescriptionProps) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
