import type {
  PropsWithChildren,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface ExecutiveGlassPanelProps
  extends PropsWithChildren {
  className?: string;
  header?: ReactNode;
}

export function ExecutiveGlassPanel({
  children,
  className,
  header,
}: ExecutiveGlassPanelProps) {
  return (
    <section
      className={cn(
        "relative flex h-full flex-col",
        className,
      )}
    >
      {header}

      <div className="flex-1">
        {children}
      </div>
    </section>
  );
}
