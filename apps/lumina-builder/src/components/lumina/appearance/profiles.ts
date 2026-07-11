import type {
  LuminaDensityMode,
  LuminaMaterialMode,
} from "./types";

export interface LuminaSurfaceProfile {
  hero: string;
  panel: string;
  card: string;
  interactive: string;
  selected: string;
  compact: string;
}

/**
 * Legacy Tailwind class profiles.
 *
 * These remain temporarily available for getLuminaSurfaceClass()
 * and existing class-based consumers such as LuminaSurface.
 *
 * Do not use these values for CSS custom properties.
 */
export const densitySurfaceProfiles:
  Record<LuminaDensityMode, LuminaSurfaceProfile> = {
    light: {
      hero: "bg-white/[0.06]",
      panel: "bg-white/[0.05]",
      card: "bg-white/[0.07]",
      interactive: "bg-white/[0.09]",
      selected: "bg-white/[0.12]",
      compact: "bg-white/[0.045]",
    },

    standard: {
      hero: "bg-white/[0.08]",
      panel: "bg-white/[0.075]",
      card: "bg-white/[0.09]",
      interactive: "bg-white/[0.11]",
      selected: "bg-white/[0.14]",
      compact: "bg-white/[0.06]",
    },

    dense: {
      hero: "bg-white/[0.11]",
      panel: "bg-white/[0.10]",
      card: "bg-white/[0.13]",
      interactive: "bg-white/[0.15]",
      selected: "bg-white/[0.18]",
      compact: "bg-white/[0.09]",
    },

    ultra: {
      hero: "bg-white/[0.14]",
      panel: "bg-white/[0.13]",
      card: "bg-white/[0.16]",
      interactive: "bg-white/[0.19]",
      selected: "bg-white/[0.22]",
      compact: "bg-white/[0.12]",
    },
  };

/**
 * Legacy Tailwind blur classes.
 *
 * These remain temporarily available for class-based consumers.
 * CSS-variable consumers must use materialBackdropFilterProfiles.
 */
export const materialBlurProfiles:
  Record<LuminaMaterialMode, string> = {
    glass: "backdrop-blur-2xl",
    solid: "backdrop-blur-sm",
    mica: "backdrop-blur-3xl",
  };

/**
 * Canonical CSS background values used by the appearance resolver.
 */
export const densitySurfaceCssProfiles:
  Record<LuminaDensityMode, LuminaSurfaceProfile> = {
    light: {
      hero: "rgba(255, 255, 255, 0.06)",
      panel: "rgba(255, 255, 255, 0.05)",
      card: "rgba(255, 255, 255, 0.07)",
      interactive:
        "rgba(255, 255, 255, 0.09)",
      selected:
        "rgba(255, 255, 255, 0.12)",
      compact:
        "rgba(255, 255, 255, 0.045)",
    },

    standard: {
      hero: "rgba(255, 255, 255, 0.08)",
      panel:
        "rgba(255, 255, 255, 0.075)",
      card: "rgba(255, 255, 255, 0.09)",
      interactive:
        "rgba(255, 255, 255, 0.11)",
      selected:
        "rgba(255, 255, 255, 0.14)",
      compact:
        "rgba(255, 255, 255, 0.06)",
    },

    dense: {
      hero: "rgba(255, 255, 255, 0.11)",
      panel: "rgba(255, 255, 255, 0.10)",
      card: "rgba(255, 255, 255, 0.13)",
      interactive:
        "rgba(255, 255, 255, 0.15)",
      selected:
        "rgba(255, 255, 255, 0.18)",
      compact:
        "rgba(255, 255, 255, 0.09)",
    },

    ultra: {
      hero: "rgba(255, 255, 255, 0.14)",
      panel: "rgba(255, 255, 255, 0.13)",
      card: "rgba(255, 255, 255, 0.16)",
      interactive:
        "rgba(255, 255, 255, 0.19)",
      selected:
        "rgba(255, 255, 255, 0.22)",
      compact:
        "rgba(255, 255, 255, 0.12)",
    },
  };

/**
 * Canonical CSS backdrop-filter values.
 */
export const materialBackdropFilterProfiles:
  Record<LuminaMaterialMode, string> = {
    glass: "blur(40px)",
    solid: "blur(4px)",
    mica: "blur(64px)",
  };
