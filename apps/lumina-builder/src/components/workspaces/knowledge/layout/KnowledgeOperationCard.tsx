import type {
  LucideIcon,
} from "lucide-react";

import {
  cn,
} from "@/lib/utils";

export type KnowledgeOperationAccent =
  | "cyan"
  | "emerald"
  | "violet"
  | "blue"
  | "gold"
  | "magenta"
  | "orange";

export interface KnowledgeOperationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  active: boolean;
  accent: KnowledgeOperationAccent;
  onClick(): void;
}

interface AccentContract {
  rail: string;
  icon: string;
  iconBorder: string;
  iconSurface: string;
  iconShadow: string;
  badge: string;
  ambient: string;
}

const ACCENTS: Record<
  KnowledgeOperationAccent,
  AccentContract
> = {
  cyan: {
    rail: "bg-cyan",
    icon: "text-cyan",
    iconBorder: "border-cyan/40",
    iconSurface: "bg-cyan/10",
    iconShadow:
      "shadow-[0_0_24px_hsl(var(--cyan)/0.28)]",
    badge:
      "border-cyan/30 bg-cyan/10 text-cyan",
    ambient:
      "bg-cyan/10",
  },
  emerald: {
    rail: "bg-emerald-400",
    icon: "text-emerald-300",
    iconBorder: "border-emerald-400/40",
    iconSurface: "bg-emerald-400/10",
    iconShadow:
      "shadow-[0_0_24px_rgba(52,211,153,0.24)]",
    badge:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    ambient:
      "bg-emerald-400/10",
  },
  violet: {
    rail: "bg-violet",
    icon: "text-violet-200",
    iconBorder: "border-violet/40",
    iconSurface: "bg-violet/10",
    iconShadow:
      "shadow-[0_0_24px_hsl(var(--violet)/0.28)]",
    badge:
      "border-violet/30 bg-violet/10 text-violet-200",
    ambient:
      "bg-violet/10",
  },
  blue: {
    rail: "bg-blue-400",
    icon: "text-blue-300",
    iconBorder: "border-blue-400/40",
    iconSurface: "bg-blue-400/10",
    iconShadow:
      "shadow-[0_0_24px_rgba(96,165,250,0.24)]",
    badge:
      "border-blue-400/30 bg-blue-400/10 text-blue-200",
    ambient:
      "bg-blue-400/10",
  },
  gold: {
    rail: "bg-gold",
    icon: "text-gold",
    iconBorder: "border-gold/40",
    iconSurface: "bg-gold/10",
    iconShadow:
      "shadow-[0_0_24px_hsl(var(--gold)/0.24)]",
    badge:
      "border-gold/30 bg-gold/10 text-gold",
    ambient:
      "bg-gold/10",
  },
  magenta: {
    rail: "bg-magenta",
    icon: "text-magenta-200",
    iconBorder: "border-magenta/40",
    iconSurface: "bg-magenta/10",
    iconShadow:
      "shadow-[0_0_24px_hsl(var(--magenta)/0.26)]",
    badge:
      "border-magenta/30 bg-magenta/10 text-magenta-200",
    ambient:
      "bg-magenta/10",
  },
  orange: {
    rail: "bg-orange-400",
    icon: "text-orange-300",
    iconBorder: "border-orange-400/40",
    iconSurface: "bg-orange-400/10",
    iconShadow:
      "shadow-[0_0_24px_rgba(251,146,60,0.24)]",
    badge:
      "border-orange-400/30 bg-orange-400/10 text-orange-200",
    ambient:
      "bg-orange-400/10",
  },
};

export function KnowledgeOperationCard({
  title,
  description,
  icon: Icon,
  active,
  accent,
  onClick,
}: KnowledgeOperationCardProps) {
  const contract =
    ACCENTS[accent];

  return (
    <button
      type="button"
      aria-current={
        active
          ? "page"
          : undefined
      }
      aria-label={
        active
          ? `${title}, active operational domain`
          : `${title}, operational domain`
      }
      onClick={onClick}
      className={cn(
        "group relative min-h-[112px] w-full overflow-hidden rounded-2xl border p-4 text-left",
        "transition-[background-color,border-color,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? [
              "[border-color:var(--lumina-border-emphasis)]",
              "[background:var(--lumina-surface-selected)]",
              "[box-shadow:var(--lumina-shadow-selected)]",
            ].join(" ")
          : [
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-compact)]",
              "hover:[border-color:var(--lumina-border-emphasis)]",
              "hover:[background:var(--lumina-surface-interactive)]",
              "hover:[box-shadow:var(--lumina-shadow-panel)]",
            ].join(" "),
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-full",
          "transition-opacity duration-200",
          contract.rail,
          active
            ? "opacity-100"
            : "opacity-0",
        )}
      />

      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -left-12 -top-14 h-36 w-36 rounded-full blur-3xl",
          "transition-opacity duration-200",
          contract.ambient,
          active
            ? "opacity-80"
            : "opacity-0 group-hover:opacity-30",
        )}
      />

      <span className="relative flex h-full min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
            "transition-[background-color,border-color,box-shadow,color] duration-200",
            active
              ? [
                  contract.iconBorder,
                  contract.iconSurface,
                  contract.iconShadow,
                ].join(" ")
              : [
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" "),
          )}
        >
          <Icon
            className={cn(
              "h-[18px] w-[18px] transition-colors duration-200",
              active
                ? contract.icon
                : "text-muted-foreground group-hover:text-foreground",
            )}
            strokeWidth={1.75}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-start justify-between gap-3">
            <span
              className={cn(
                "truncate text-sm font-semibold",
                active
                  ? "text-foreground"
                  : "text-foreground/90",
              )}
            >
              {title}
            </span>

            {active && (
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-1",
                  "text-[8px] font-semibold uppercase tracking-[0.16em]",
                  contract.badge,
                )}
              >
                Active
              </span>
            )}
          </span>

          <span className="mt-2 block max-w-[34rem] text-[11px] leading-5 text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
    </button>
  );
}

export default KnowledgeOperationCard;
