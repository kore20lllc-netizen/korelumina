import {
  densitySurfaceProfiles,
  materialBlurProfiles,
} from "../profiles";

import type {
  LuminaAppearanceSettings,
} from "../types";

import type {
  LuminaResolvedAppearance,
} from "./types";

export function resolveAppearance(
  settings: LuminaAppearanceSettings,
): LuminaResolvedAppearance {
  const surface =
    densitySurfaceProfiles[settings.density];

  const blur =
    materialBlurProfiles[settings.material];

  return {
    surface,

    blur: {
      surface: blur,
    },

    border: {
      standard: "border-white/12",
      emphasis:
        settings.contrast === "high"
          ? "border-white/20"
          : "border-white/14",
    },

    shadow: {
      panel:
        "shadow-[0_24px_80px_-30px_rgba(0,0,0,.62)]",

      hero:
        "shadow-[0_40px_120px_-45px_rgba(0,0,0,.65)]",

      selected:
        "shadow-[0_28px_90px_-28px_rgba(201,130,18,.36)]",
    },

    ambient: {
      opacity:
        settings.ambient / 100,

      motion:
        settings.motion / 100,

      transparency:
        settings.transparency / 100,
    },
  };
}
