import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface ExecutiveActivityRailProps
  extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function ExecutiveActivityRail({
  children,
  className,
  ...props
}: ExecutiveActivityRailProps) {
  return (
    <aside
      {...props}
      className={cn(
        "relative flex min-h-0 flex-col",
        "rounded-[28px]",
        "border border-cyan-400/20",
        "bg-white/[0.04]",
        "backdrop-blur-2xl",
        "ring-1 ring-white/10",
        "overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    </aside>
  );
}
