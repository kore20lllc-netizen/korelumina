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
  default: "border border-white/12",
  panel: "border border-white/12",
  hero: "border border-white/12",
  sidebar: "border border-white/12",
  toolbar: "border border-white/12",
  card: "border border-white/14",
  interactive: "border border-white/14",
  selected: "border border-amber-500/35",
  compact: "border border-white/12",
};

const shadowByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default:
    "shadow-[0_24px_80px_-30px_rgba(0,0,0,.62)]",
  panel:
    "shadow-[0_24px_80px_-30px_rgba(0,0,0,.62)]",
  hero:
    "shadow-[0_40px_120px_-45px_rgba(0,0,0,.65)]",
  sidebar:
    "shadow-[0_24px_80px_-30px_rgba(0,0,0,.58)]",
  toolbar:
    "shadow-[0_16px_48px_-26px_rgba(0,0,0,.58)]",
  card:
    "shadow-[0_26px_80px_-30px_rgba(0,0,0,.58)]",
  interactive:
    "shadow-[0_26px_80px_-30px_rgba(0,0,0,.58)]",
  selected:
    "shadow-[0_28px_90px_-28px_rgba(201,130,18,.36)]",
  compact:
    "shadow-[0_16px_48px_-26px_rgba(0,0,0,.58)]",
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
