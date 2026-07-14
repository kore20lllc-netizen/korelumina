import type {
  HTMLAttributes,
} from "react";

import {
  Slot,
} from "@radix-ui/react-slot";

import {
  luminaMotion,
} from "@/components/lumina/appearance/motion";

import {
  cn,
} from "@/lib/utils";

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

  /**
   * Enables the certified Lumina hover, elevation, focus,
   * reflection, and press interaction model.
   */
  interactive?: boolean;
}

const backgroundByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default:
    "[background:var(--lumina-surface-hero)]",

  panel:
    "[background:var(--lumina-surface-hero)]",

  hero:
    "[background:var(--lumina-surface-hero)]",

  sidebar:
    "[background:var(--lumina-surface-hero)]",

  toolbar:
    "[background:var(--lumina-surface-hero)]",

  card:
    "[background:var(--lumina-surface-hero)]",

  interactive:
    "[background:var(--lumina-surface-interactive)]",

  selected:
    "[background:var(--lumina-surface-selected)]",

  compact:
    "[background:var(--lumina-surface-hero)]",
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
    "border [border-color:var(--lumina-border-emphasis)]",

  sidebar:
    "border [border-color:var(--lumina-border-standard)]",

  toolbar:
    "border [border-color:var(--lumina-border-standard)]",

  card:
    "border [border-color:var(--lumina-border-standard)]",

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

const elevationByVariant: Record<
  LuminaSurfaceVariant,
  string
> = {
  default:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-1px))]",

  panel:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-1px))]",

  hero:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-2px))]",

  sidebar:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-1px))]",

  toolbar:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-0.5px))]",

  card:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-1px))]",

  interactive:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-0.75px))]",

  selected:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-1.5px))]",

  compact:
    "[transform:translateY(calc(var(--lumina-elevation-level)*-0.5px))]",
};

const interactiveByVariant: Record<
  LuminaSurfaceVariant,
  boolean
> = {
  default: true,
  panel: true,
  hero: false,
  sidebar: false,
  toolbar: false,
  card: true,
  interactive: true,
  selected: true,
  compact: true,
};

const interactionClasses = cn(
  "relative isolate",

  "before:pointer-events-none",
  "before:absolute",
  "before:inset-0",
  "before:z-0",
  "before:rounded-[inherit]",
  "before:opacity-0",
  "before:[background:var(--lumina-highlight-overlay)]",
  luminaMotion.reflection,

  "hover:-translate-y-1",
  "hover:[border-color:var(--lumina-border-emphasis)]",
  "hover:[background:var(--lumina-surface-interactive)]",
  "hover:[box-shadow:var(--lumina-shadow-hover)]",
  "hover:before:opacity-100",

  "active:-translate-y-0.5",
  "active:[box-shadow:var(--lumina-shadow-selected)]",
  luminaMotion.press,

  "focus-visible:outline-none",
  "focus-visible:[border-color:var(--lumina-border-emphasis)]",
  "focus-visible:[box-shadow:var(--lumina-shadow-hover)]",
  "focus-visible:ring-2",
  "focus-visible:[--tw-ring-color:var(--lumina-accent-color)]",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-background",
);

export function LuminaSurface({
  className,
  variant = "panel",
  children,
  asChild = false,
  interactive = true,
  ...props
}: LuminaSurfaceProps) {
  const Comp =
    asChild
      ? Slot
      : "div";

  const hasInteraction =
    interactive &&
    interactiveByVariant[variant];

  return (
    <Comp
      className={cn(
        luminaMotion.surface,
        "will-change-transform",
        backgroundByVariant[variant],
        "[backdrop-filter:var(--lumina-blur-surface)]",
        radiusByVariant[variant],
        borderByVariant[variant],
        shadowByVariant[variant],
        elevationByVariant[variant],
        hasInteraction &&
          interactionClasses,
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export default LuminaSurface;
