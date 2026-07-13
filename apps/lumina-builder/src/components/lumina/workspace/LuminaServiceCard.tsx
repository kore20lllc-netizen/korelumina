import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import {
  LuminaSurface,
} from "@/components/lumina/surface/LuminaSurface";

import {
  cn,
} from "@/lib/utils";

export interface LuminaServiceCardProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "title"
  > {
  title: ReactNode;
  status: ReactNode;
  badge?: ReactNode;
  subtitle?: ReactNode;
  metrics?: ReactNode;
  sparkline?: ReactNode;
  footer?: ReactNode;
  selected?: boolean;
}

export const LuminaServiceCard = forwardRef<
  HTMLButtonElement,
  LuminaServiceCardProps
>(
  (
    {
      title,
      status,
      badge,
      subtitle,
      metrics,
      sparkline,
      footer,
      selected = false,
      className,
      type = "button",
      ...buttonProps
    },
    ref,
  ) => {
    return (
      <LuminaSurface
        asChild
        variant={selected ? "selected" : "card"}
        className={cn(
          "group w-full overflow-hidden",
          "transition-all duration-300",
          selected
            ? [
                "[border-color:var(--lumina-border-emphasis)]",
                "[background:var(--lumina-surface-selected)]",
                "[box-shadow:var(--lumina-shadow-selected)]",
                "scale-[1.005]",
              ]
            : [
                "[border-color:var(--lumina-border-standard)]",
                "[background:var(--lumina-surface-card)]",
                "hover:[border-color:var(--lumina-border-emphasis)]",
                "hover:[background:var(--lumina-surface-interactive)]",
                "hover:[box-shadow:var(--lumina-shadow-hover)]",
              ],
          className,
        )}
      >
        <button
          ref={ref}
          type={type}
          className={cn(
            "flex w-full flex-col gap-4 p-4 text-left",
            "[border-radius:var(--lumina-radius-surface)]",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:[--tw-ring-color:var(--lumina-accent-color)]",
          )}
          {...buttonProps}
        >
          <header className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[15px] font-semibold tracking-tight text-foreground">
                {title}
              </div>

              {subtitle && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {subtitle}
                </div>
              )}
            </div>

            {badge && (
              <div className="shrink-0">
                {badge}
              </div>
            )}
          </header>

          <div className="w-full">
            {status}
          </div>

          {(metrics || sparkline) && (
            <div className="flex w-full flex-col gap-4">
              {sparkline && (
                <div className="w-full">
                  {sparkline}
                </div>
              )}

              {metrics && (
                <div className="w-full">
                  {metrics}
                </div>
              )}
            </div>
          )}

          {footer && (
            <footer
              className={cn(
                "w-full border-t pt-4",
                "[border-color:var(--lumina-border-standard)]",
              )}
            >
              {footer}
            </footer>
          )}
        </button>
      </LuminaSurface>
    );
  },
);

LuminaServiceCard.displayName =
  "LuminaServiceCard";

export default LuminaServiceCard;
