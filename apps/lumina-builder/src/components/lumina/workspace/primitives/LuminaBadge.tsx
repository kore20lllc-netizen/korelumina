import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaBadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info";
  className?: string;
}

const VARIANTS = {
  default:
    "border border-white/10 bg-white/[0.05] text-muted-foreground",
  success:
    "border border-cyan/30 bg-cyan/10 text-cyan-100",
  warning:
    "border border-amber-400/30 bg-amber-400/10 text-amber-100",
  danger:
    "border border-rose-400/30 bg-rose-400/10 text-rose-100",
  info:
    "border border-violet/30 bg-violet/10 text-violet-100",
} as const;

export function LuminaBadge({
  children,
  variant = "default",
  className,
}: LuminaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "rounded-full",
        "px-2.5 py-1",
        "text-[10px]",
        "font-semibold",
        "uppercase",
        "tracking-[0.16em]",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default LuminaBadge;
