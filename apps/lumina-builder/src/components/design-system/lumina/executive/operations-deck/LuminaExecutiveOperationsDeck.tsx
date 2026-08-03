import type {
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaExecutiveOperationsDeckProps {
  ariaLabel: string;
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function LuminaExecutiveOperationsDeck({
  ariaLabel,
  icon,
  title,
  description,
  status,
  children,
  className,
}: LuminaExecutiveOperationsDeckProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "group/deck relative min-w-0 overflow-hidden transition-all duration-500",
        "rounded-[18px]",
        "border border-white/[0.08]",
        "bg-[linear-gradient(145deg,rgba(15,23,42,.72),rgba(15,23,42,.56))]",
        "shadow-[0_18px_120px_rgba(0,0,0,.34)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0",
          "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.06),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,.07),transparent_42%)]",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[9%] top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
              {icon}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/74">
                {title}
              </p>

              {description ? (
                <p className="mt-0.5 truncate text-[9px] tracking-[0.015em] text-white/36">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {status}
        </div>

        <div>
          {children}
        </div>
      </div>
    </section>
  );
}
