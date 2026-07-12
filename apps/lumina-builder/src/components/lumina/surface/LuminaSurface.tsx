import type {
  HTMLAttributes,
} from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type LuminaSurfaceVariant =
  | "default"
  | "panel"
  | "hero"
  | "sidebar"
  | "toolbar"
  | "card"
  | "interactive"
  | "selected"
  | "compact";

export interface LuminaSurfaceProps
  extends HTMLAttributes<HTMLDivElement> {
  variant?: LuminaSurfaceVariant;
  asChild?: boolean;
}

const backgroundByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default:
    "[background:var(--lumina-surface-panel)]",
  panel:
    "[background:var(--lumina-surface-panel)]",
  hero:
    "[background:var(--lumina-surface-hero)]",
  sidebar:
    "[background:var(--lumina-surface-panel)]",
  toolbar:
    "[background:var(--lumina-surface-compact)]",
  card:
    "[background:var(--lumina-surface-card)]",
  interactive:
    "[background:var(--lumina-surface-interactive)]",
  selected:
    "[background:var(--lumina-surface-selected)]",
  compact:
    "[background:var(--lumina-surface-compact)]",
};

const radiusByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default:
    "[border-radius:var(--lumina-radius-surface)]",
  panel:
    "[border-radius:var(--lumina-radius-surface)]",
  hero:
    "[border-radius:calc(var(--lumina-radius-surface)*1.15)]",
  sidebar:
    "[border-radius:var(--lumina-radius-surface)]",
  toolbar:
    "[border-radius:var(--lumina-radius-inner)]",
  card:
    "[border-radius:var(--lumina-radius-surface)]",
  interactive:
    "[border-radius:var(--lumina-radius-surface)]",
  selected:
    "[border-radius:var(--lumina-radius-surface)]",
  compact:
    "[border-radius:var(--lumina-radius-inner)]",
};

const borderByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default:
    "border [border-color:var(--lumina-border-standard)]",
  panel:
    "border [border-color:var(--lumina-border-standard)]",
  hero:
    "border [border-color:var(--lumina-border-standard)]",
  sidebar:
    "border [border-color:var(--lumina-border-standard)]",
  toolbar:
    "border [border-color:var(--lumina-border-standard)]",
  card:
    "border [border-color:var(--lumina-border-emphasis)]",
  interactive:
    "border [border-color:var(--lumina-border-emphasis)]",
  selected:
    "border [border-color:var(--lumina-border-emphasis)]",
  compact:
    "border [border-color:var(--lumina-border-standard)]",
};

const shadowByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default:
    "[box-shadow:var(--lumina-shadow-panel)]",
  panel:
    "[box-shadow:var(--lumina-shadow-panel)]",
  hero:
    "[box-shadow:var(--lumina-shadow-hero)]",
  sidebar:
    "[box-shadow:var(--lumina-shadow-panel)]",
  toolbar:
    "[box-shadow:var(--lumina-shadow-panel)]",
  card:
    "[box-shadow:var(--lumina-shadow-panel)]",
  interactive:
    "[box-shadow:var(--lumina-shadow-panel)]",
  selected:
    "[box-shadow:var(--lumina-shadow-selected)]",
  compact:
    "[box-shadow:var(--lumina-shadow-panel)]",
};

export function LuminaSurface({
  className,
  variant = "panel",
  children,
  asChild = false,
  ...props
}: LuminaSurfaceProps) {
  const Comp = asChild
    ? Slot
    : "div";

  return (
    <Comp
      className={cn(
        "transition-all duration-300",
        backgroundByVariant[variant],
        "[backdrop-filter:var(--lumina-blur-surface)]",
        radiusByVariant[variant],
        borderByVariant[variant],
        shadowByVariant[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
