import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ExecutiveExecutionFrameProps
  extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function ExecutiveExecutionFrame({
  children,
  className,
  ...props
}: ExecutiveExecutionFrameProps) {
  return (
    <section
      {...props}
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "border border-cyan-400/35",
        "bg-slate-950/70",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_36px_rgba(34,211,238,0.18)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top,rgba(34,211,238,.14),transparent_58%)]
        "
      />

      <div
        aria-hidden
        className="
          absolute
          inset-[1px]
          rounded-[22px]
          border
          border-cyan-300/10
        "
      />

      <div className="relative p-6">
        {children}
      </div>
    </section>
  );
}
