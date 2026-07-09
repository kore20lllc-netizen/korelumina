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

export const materialBlurProfiles:
  Record<LuminaMaterialMode, string> = {
    glass: "backdrop-blur-2xl",
    solid: "backdrop-blur-sm",
    mica: "backdrop-blur-3xl",
  };
