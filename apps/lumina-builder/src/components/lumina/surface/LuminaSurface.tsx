import type {
  HTMLAttributes,
} from "react";

import {
  getLuminaSurfaceClass,
  useLuminaAppearance,
} from "@/components/lumina/appearance";

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

  /**
   * Reserved for future slot-based composition.
   * Kept here so existing consumers do not leak `asChild`
   * onto the DOM.
   */
  asChild?: boolean;
}

const variantMap: Record<
  LuminaSurfaceVariant,
  | "hero"
  | "panel"
  | "card"
  | "interactive"
  | "selected"
  | "compact"
> = {
  default: "panel",
  panel: "panel",
  hero: "hero",
  sidebar: "panel",
  toolbar: "compact",
  card: "card",
  interactive: "interactive",
  selected: "selected",
  compact: "compact",
};

const shapeByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default: "rounded-3xl",
  panel: "rounded-3xl",
  hero: "rounded-[2rem]",
  sidebar: "rounded-3xl",
  toolbar: "rounded-2xl",
  card: "rounded-3xl",
  interactive: "rounded-3xl",
  selected: "rounded-3xl",
  compact: "rounded-2xl",
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
  asChild: _asChild,
  ...props
}: LuminaSurfaceProps) {
  const { settings } =
    useLuminaAppearance();

  const surfaceVariant =
    variantMap[variant];

  return (
    <div
      className={cn(
        "glass-panel",
        "transition-all duration-300",
        getLuminaSurfaceClass(
          surfaceVariant,
          settings,
        ),
        shapeByVariant[variant],
        borderByVariant[variant],
        shadowByVariant[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
