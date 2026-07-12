import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";

export interface LuminaServiceCardProps {
  title: ReactNode;
  status: ReactNode;
  badge?: ReactNode;
  subtitle?: ReactNode;
  metrics?: ReactNode;
  sparkline?: ReactNode;
  footer?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LuminaServiceCard({
  title,
  status,
  badge,
  subtitle,
  metrics,
  sparkline,
  footer,
  selected,
  onClick,
  className,
}: LuminaServiceCardProps) {
  return (
    <LuminaSurface
      asChild
      variant="panel"
      className={cn(
        "transition-all duration-300",
        selected
          ? [
              "[border-color:var(--lumina-border-emphasis)]",
              "[background:var(--lumina-surface-selected)]",
              "[box-shadow:var(--lumina-shadow-selected)]",
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
        type="button"
        onClick={onClick}
        className="
          flex
          w-full
          flex-col
          gap-5
          p-5
          text-left
          [border-radius:var(--lumina-radius-surface)]
        "
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-lg font-semibold tracking-tight">
              {title}
            </div>

            {subtitle && (
              <div className="mt-1 text-sm text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>

          {badge}
        </header>

        <div>{status}</div>

        {(metrics || sparkline) && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {metrics}
            </div>

            {sparkline}
          </div>
        )}

        {footer && (
          <footer
            className={cn(
              "border-t pt-4",
              "[border-color:var(--lumina-border-standard)]",
            )}
          >
            {footer}
          </footer>
        )}
      </button>
    </LuminaSurface>
  );
}

export default LuminaServiceCard;
