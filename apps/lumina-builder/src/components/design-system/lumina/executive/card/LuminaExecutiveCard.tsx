import type {
  MouseEventHandler,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type LuminaExecutiveAccent =
  | "slate"
  | "cyan"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "blue"
  | "orange";

export interface LuminaExecutiveCardProps {
  variant?: "metric" | "summary" | "detail";

  title?: ReactNode;
  value?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;

  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;

  accentKey?: LuminaExecutiveAccent;

  className?: string;
  titleClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;

  as?: "section" | "button";

  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;

  onClick?: MouseEventHandler<HTMLElement>;
}

const titleAccentVariants: Record<
  LuminaExecutiveAccent,
  string
> = {
  slate: "text-slate-300",
  cyan: "text-cyan-300",
  emerald: "text-emerald-300",
  violet: "text-violet-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
  blue: "text-blue-300",
  orange: "text-orange-300",
};

const iconSurfaceVariants: Record<
  LuminaExecutiveAccent,
  string
> = {
  slate: "bg-slate-400/10 border-slate-400/20",
  cyan: "bg-cyan-400/10 border-cyan-400/20",
  emerald: "bg-emerald-400/10 border-emerald-400/20",
  violet: "bg-violet-400/10 border-violet-400/20",
  amber: "bg-amber-400/10 border-amber-400/20",
  rose: "bg-rose-400/10 border-rose-400/20",
  blue: "bg-blue-400/10 border-blue-400/20",
  orange: "bg-orange-400/10 border-orange-400/20",
};

const glowVariants: Record<
  LuminaExecutiveAccent,
  string
> = {
  slate: "shadow-[0_14px_72px_rgba(0,0,0,.28)]",
  cyan: "shadow-[0_0_55px_rgba(98,214,255,.08)]",
  emerald: "shadow-[0_14px_72px_rgba(0,0,0,.28)]",
  violet: "shadow-[0_0_60px_rgba(132,88,255,.09)]",
  amber: "shadow-[0_0_50px_rgba(248,186,54,.08)]",
  rose: "shadow-[0_14px_72px_rgba(0,0,0,.28)]",
  blue: "shadow-[0_14px_72px_rgba(0,0,0,.28)]",
  orange: "shadow-[0_14px_72px_rgba(0,0,0,.28)]",
};

const variantClasses: Record<
  NonNullable<LuminaExecutiveCardProps["variant"]>,
  string
> = {
  metric: "px-6 py-5",
  summary: "px-5 py-4",
  detail: "px-6 py-6",
};

export function LuminaExecutiveCard({
  title,
  value,
  description,
  titleClassName,
  icon,
  header,
  footer,
  children,
  accentKey = "cyan",

  className,
  headerClassName,
  bodyClassName,
  footerClassName,

  variant = "metric",

  as = "section",
  interactive = false,
  selected = false,
  disabled = false,
  onClick,
}: LuminaExecutiveCardProps) {
  const Component = as;

  const titleAccent =
    titleAccentVariants[accentKey];

  const surfaceAccent =
    iconSurfaceVariants[accentKey];

  const glowAccent =
    glowVariants[accentKey];

  const iconNode = icon ? (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center",
        "rounded-[18px]",
        surfaceAccent,
      )}
    >
      {icon}
    </div>
  ) : null;

  return (
    <Component
      type={
        Component === "button"
          ? "button"
          : undefined
      }
      onClick={onClick}
      disabled={
        Component === "button"
          ? disabled
          : undefined
      }
      aria-pressed={
        Component === "button" &&
        interactive
          ? selected
          : undefined
      }
      className={cn(
        "group relative overflow-hidden text-left",
        "rounded-[18px]",
        "border border-white/[0.08]",
        "bg-[linear-gradient(145deg,rgba(15,23,42,.72),rgba(15,23,42,.56))]",
        "shadow-[0_18px_120px_rgba(0,0,0,.34)]",
        variantClasses[variant],

        interactive && [
          "cursor-pointer",
          "transition-all duration-300",
          "hover:-translate-y-0.5",
          "hover:border-white/20",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-cyan-300/40",
          "focus-visible:ring-offset-2",
          "focus-visible:ring-offset-slate-950",
          glowAccent,
        ],

        selected && [
          "border-cyan-300/35",
          "ring-1 ring-cyan-300/25",
        ],

        disabled && [
          "pointer-events-none",
          "cursor-not-allowed",
          "opacity-50",
        ],

        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0",
          "opacity-0",
          "transition-opacity duration-300",
          "group-hover:opacity-100",
          "[background:radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_55%)]",
          selected && "opacity-100",
        )}
      />

      <div
        className={cn(
          "relative flex h-full flex-col gap-5",
          bodyClassName,
        )}
      >
        {header ?? (
          <div
            className={cn(
              "flex items-start justify-between gap-5",
              headerClassName,
            )}
          >
            <div className="min-w-0">
              {title ? (
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.18em]",
                    titleClassName ??
                      titleAccent,
                  )}
                >
                  {title}
                </p>
              ) : null}

              {value ? (
                <div className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {value}
                </div>
              ) : null}
            </div>

            {iconNode}
          </div>
        )}

        {children}

        {description ? (
          <div className="text-[11px] leading-5 text-white/60">
            {description}
          </div>
        ) : null}

        {footer ? (
          <div
            className={cn(
              "mt-auto",
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </Component>
  );
}
