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
              "border-amber-500/35",
              "bg-white/[0.09]",
              "shadow-[0_18px_50px_rgba(201,130,18,.18)]",
            ]
          : [
              "border-white/10",
              "bg-white/[0.075]",
              "hover:border-white/20",
              "hover:bg-white/[0.09]",
            ],
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col gap-5 rounded-3xl p-5 text-left"
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
          <footer className="border-t border-white/8 pt-4">
            {footer}
          </footer>
        )}
      </button>
    </LuminaSurface>
  );
}

export default LuminaServiceCard;
