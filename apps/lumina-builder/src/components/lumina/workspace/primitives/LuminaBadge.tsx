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
