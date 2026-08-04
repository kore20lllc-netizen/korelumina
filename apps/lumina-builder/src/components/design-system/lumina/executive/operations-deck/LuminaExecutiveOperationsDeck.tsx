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
        "rounded-[28px]",
        "border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20",
        "bg-slate-950/48 backdrop-blur-[44px] backdrop-saturate-[170%]",
        "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_24px_rgba(37,99,235,.18),0_18px_120px_rgba(0,0,0,.34),inset_0_0_18px_rgba(56,189,248,.05)]",
        "hover:-translate-y-1 hover:border-cyan-200/80",
        "hover:shadow-[0_0_0_1px_rgba(59,130,246,.22),0_0_30px_rgba(37,99,235,.24),0_22px_54px_rgba(2,6,23,.34),inset_0_0_20px_rgba(56,189,248,.06)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_2%,rgba(124,58,237,.30),transparent_36%),radial-gradient(circle_at_29%_42%,rgba(217,119,6,.17),transparent_27%),radial-gradient(circle_at_74%_64%,rgba(67,56,202,.13),transparent_30%),radial-gradient(circle_at_91%_14%,rgba(34,211,238,.035),transparent_22%),radial-gradient(circle_at_57%_86%,rgba(236,72,153,.075),transparent_18%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_24%,rgba(2,6,23,.10))]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[9%] top-0 h-px opacity-80 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.58)_50%,rgba(125,211,252,.24)_69%,rgba(59,130,246,.08)_88%,transparent_100%)] [box-shadow:0_0_18px_rgba(125,211,252,.12),0_0_34px_rgba(247,215,116,.07)]"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-blue-400/55 ring-1 ring-inset ring-cyan-300/18 bg-[radial-gradient(circle_at_30%_20%,rgba(125,211,252,.16),transparent_52%),linear-gradient(145deg,rgba(37,99,235,.14),rgba(8,47,73,.10))] text-white/85 shadow-[0_0_0_1px_rgba(59,130,246,.10),0_0_18px_rgba(37,99,235,.18),inset_0_1px_0_rgba(255,255,255,.08)]">
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

        <div>{children}</div>
      </div>
    </section>
  );
}
