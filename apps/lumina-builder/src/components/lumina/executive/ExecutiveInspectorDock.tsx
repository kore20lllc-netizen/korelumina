import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface ExecutiveInspectorDockProps
  extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function ExecutiveInspectorDock({
  children,
  className,
  ...props
}: ExecutiveInspectorDockProps) {
  return (
    <aside
      {...props}
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden",
        "rounded-[28px]",
        "border border-cyan-400/20",
        "bg-white/[0.04]",
        "backdrop-blur-2xl",
        "ring-1 ring-white/10",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent"
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    </aside>
  );
}
