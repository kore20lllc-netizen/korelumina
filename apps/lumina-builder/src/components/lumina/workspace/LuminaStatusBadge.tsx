import type {
  HTMLAttributes,
} from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export type LuminaStatusTone =
  | "healthy"
  | "active"
  | "warning"
  | "error"
  | "neutral";

const statusBadge = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1",
  {
    variants: {
      variant: {
        neutral: [
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-interactive)]",
          "text-muted-foreground",
          "text-xs font-medium transition-colors",
        ].join(" "),

        accent: [
          "[border-color:var(--lumina-border-emphasis)]",
          "[background:var(--lumina-surface-selected)]",
          "[box-shadow:var(--lumina-shadow-selected)]",
          "text-white",
          "text-xs font-medium transition-colors",
        ].join(" "),

        healthy: [
          "border-emerald-300/24",
          "bg-emerald-300/[0.07]",
          "text-emerald-100",
          "text-[9px] font-semibold uppercase tracking-[0.12em]",
        ].join(" "),

        active: [
          "border-cyan-300/24",
          "bg-cyan-300/[0.07]",
          "text-cyan-100",
          "text-[9px] font-semibold uppercase tracking-[0.12em]",
        ].join(" "),

        warning: [
          "border-amber-300/24",
          "bg-amber-300/[0.07]",
          "text-amber-100",
          "text-[9px] font-semibold uppercase tracking-[0.12em]",
        ].join(" "),

        error: [
          "border-rose-300/24",
          "bg-rose-300/[0.07]",
          "text-rose-100",
          "text-[9px] font-semibold uppercase tracking-[0.12em]",
        ].join(" "),
      },
    },

    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface LuminaStatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadge> {}

export function LuminaStatusBadge({
  className,
  variant,
  ...props
}: LuminaStatusBadgeProps) {
  return (
    <span
      className={cn(
        statusBadge({
          variant,
        }),
        className,
      )}
      {...props}
    />
  );
}

export default LuminaStatusBadge;
