import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ExecutivePanelContour({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      className={cn(
        "relative overflow-hidden",
        "rounded-[32px]",
        "border border-cyan-400/20",
        "bg-white/[0.05]",
        "backdrop-blur-[28px]",
        "ring-1 ring-white/10",
        "shadow-[0_1px_0_rgba(255,255,255,.08)_inset,0_30px_90px_rgba(0,0,0,.45)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-cyan-400/[0.03]" />
      <div className="relative h-full">
        {children}
      </div>
    </section>
  );
}
