import type { HTMLAttributes } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-full",
    "border",
    "px-2.5 py-1",
    "text-xs font-medium",
    "transition-colors",
  ].join(" "),
  {
    variants: {
      variant: {
        neutral: [
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-interactive)]",
          "text-muted-foreground",
        ].join(" "),

        accent: [
          "[border-color:var(--lumina-border-emphasis)]",
          "[background:var(--lumina-surface-selected)]",
          "[box-shadow:var(--lumina-shadow-selected)]",
          "text-white",
        ].join(" "),

        complete:
          "border-emerald-300/22 bg-emerald-300/[0.07] text-emerald-200",

        active:
          "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100",

        partial:
          "border-amber-300/24 bg-amber-300/[0.07] text-amber-200",

        blocked:
          "border-rose-300/22 bg-rose-300/[0.065] text-rose-200",

        review:
          "border-violet-300/22 bg-violet-300/[0.065] text-violet-200",

        muted:
          "border-white/12 bg-white/[0.035] text-white/58",
      },
    },

    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface LuminaBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function LuminaBadge({
  className,
  variant,
  ...props
}: LuminaBadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants({
          variant,
        }),
        className,
      )}
      {...props}
    />
  );
}

export default LuminaBadge;
