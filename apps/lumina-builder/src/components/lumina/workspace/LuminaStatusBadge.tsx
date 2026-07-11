import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadge = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
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

export interface LuminaStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
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
