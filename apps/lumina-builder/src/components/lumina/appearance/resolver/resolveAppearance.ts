import {
  densitySurfaceCssProfiles,
  materialBackdropFilterProfiles,
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
    densitySurfaceCssProfiles[
      settings.density
    ];

  const blur =
    materialBackdropFilterProfiles[
      settings.material
    ];

  return {
    surface,

    blur: {
      surface: blur,
    },

    border: {
      standard:
        "rgba(255, 255, 255, 0.12)",

      emphasis:
        settings.contrast === "high"
          ? "rgba(255, 255, 255, 0.20)"
          : "rgba(255, 255, 255, 0.14)",
    },

    shadow: {
      panel:
        "0 24px 80px -30px rgba(0, 0, 0, 0.62)",

      hero:
        "0 40px 120px -45px rgba(0, 0, 0, 0.65)",

      selected:
        "0 28px 90px -28px rgba(201, 130, 18, 0.36)",
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
