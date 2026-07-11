import type {
  LuminaAccentMode,
  LuminaAppearanceSettings,
  LuminaDensityMode,
  LuminaElevationMode,
  LuminaGlowMode,
  LuminaMaterialMode,
  LuminaRadiusMode,
  LuminaSpacingMode,
  LuminaTintMode,
} from "../types";

import type {
  LuminaResolvedAppearance,
} from "./types";

type Rgb = readonly [
  number,
  number,
  number,
];

interface SurfaceOpacityProfile {
  hero: number;
  panel: number;
  card: number;
  interactive: number;
  selected: number;
  compact: number;
}

const DENSITY_OPACITY:
  Record<
    LuminaDensityMode,
    SurfaceOpacityProfile
  > = {
    light: {
      hero: 0.15,
      panel: 0.125,
      card: 0.16,
      interactive: 0.19,
      selected: 0.24,
      compact: 0.11,
    },

    standard: {
      hero: 0.18,
      panel: 0.165,
      card: 0.20,
      interactive: 0.24,
      selected: 0.30,
      compact: 0.14,
    },

    dense: {
      hero: 0.24,
      panel: 0.22,
      card: 0.28,
      interactive: 0.32,
      selected: 0.38,
      compact: 0.20,
    },

    ultra: {
      hero: 0.30,
      panel: 0.28,
      card: 0.34,
      interactive: 0.40,
      selected: 0.46,
      compact: 0.26,
    },
  };

const TINT_RGB:
  Record<LuminaTintMode, Rgb> = {
    none: [255, 255, 255],
    dark: [15, 18, 28],
    frost: [226, 238, 255],
    warm: [255, 218, 168],
    cool: [174, 213, 255],
  };

const ACCENT_RGB:
  Record<LuminaAccentMode, Rgb> = {
    amber: [245, 158, 11],
    blue: [59, 130, 246],
    purple: [139, 92, 246],
    emerald: [16, 185, 129],
  };

const MATERIAL_OPACITY:
  Record<LuminaMaterialMode, number> = {
    glass: 1,
    solid: 2.5,
    mica: 0.88,
  };

const MATERIAL_BLUR:
  Record<LuminaMaterialMode, number> = {
    glass: 0.64,
    solid: 0.08,
    mica: 0.92,
  };

const RADIUS:
  Record<LuminaRadiusMode, number> = {
    small: 12,
    medium: 20,
    large: 30,
  };

const SPACING:
  Record<
    LuminaSpacingMode,
    {
      compact: number;
      standard: number;
      relaxed: number;
    }
  > = {
    compact: {
      compact: 0.5,
      standard: 0.75,
      relaxed: 1,
    },

    comfortable: {
      compact: 0.75,
      standard: 1,
      relaxed: 1.5,
    },

    relaxed: {
      compact: 1,
      standard: 1.5,
      relaxed: 2,
    },
  };

const ELEVATION:
  Record<LuminaElevationMode, number> = {
    flat: 0.25,
    raised: 0.7,
    floating: 1,
  };

const GLOW:
  Record<LuminaGlowMode, number> = {
    none: 0,
    low: 0.35,
    medium: 0.68,
    high: 1,
  };

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

function percent(
  value: number,
): number {
  return clamp(
    value,
    0,
    100,
  ) / 100;
}

function rgba(
  rgb: Rgb,
  alpha: number,
): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamp(
    alpha,
    0,
    1,
  ).toFixed(3)})`;
}

function rgbString(
  rgb: Rgb,
): string {
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
}

function resolveSurfaceOpacity(
  base: number,
  settings: LuminaAppearanceSettings,
): number {
  const transparency =
    1 - percent(
      settings.transparency,
    );

  return clamp(
    base *
      transparency *
      MATERIAL_OPACITY[
        settings.material
      ],
    0.02,
    settings.material === "solid"
      ? 0.96
      : 0.72,
  );
}

function resolveShadowAlpha(
  settings: LuminaAppearanceSettings,
  multiplier: number,
): number {
  return clamp(
    percent(
      settings.shadowIntensity,
    ) *
      ELEVATION[
        settings.elevation
      ] *
      multiplier,
    0,
    0.82,
  );
}

export function resolveAppearance(
  settings: LuminaAppearanceSettings,
): LuminaResolvedAppearance {
  const opacity =
    DENSITY_OPACITY[
      settings.density
    ];

  const tintRgb =
    TINT_RGB[
      settings.tint
    ];

  const accentRgb =
    ACCENT_RGB[
      settings.accent
    ];

  const tintStrength =
    percent(
      settings.tintStrength,
    );

  const blurPixels =
    Math.round(
      percent(
        settings.blur,
      ) *
        100 *
        MATERIAL_BLUR[
          settings.material
        ],
    );

  const radius =
    RADIUS[
      settings.radius
    ];

  const spacing =
    SPACING[
      settings.spacing
    ];

  const glowOpacity =
    percent(
      settings.glowIntensity,
    ) *
    GLOW[
      settings.glow
    ];

  const motionScale =
    settings.animation === "off"
      ? 0
      : settings.animation === "reduced"
        ? Math.min(
            percent(
              settings.motion,
            ),
            0.35,
          )
        : percent(
            settings.motion,
          );

  const duration =
    Math.round(
      120 +
        motionScale * 480,
    );

  return {
    surface: {
      hero:
        rgba(
          tintRgb,
          resolveSurfaceOpacity(
            opacity.hero,
            settings,
          ),
        ),

      panel:
        rgba(
          tintRgb,
          resolveSurfaceOpacity(
            opacity.panel,
            settings,
          ),
        ),

      card:
        rgba(
          tintRgb,
          resolveSurfaceOpacity(
            opacity.card,
            settings,
          ),
        ),

      interactive:
        rgba(
          tintRgb,
          resolveSurfaceOpacity(
            opacity.interactive,
            settings,
          ),
        ),

      selected:
        rgba(
          tintRgb,
          resolveSurfaceOpacity(
            opacity.selected,
            settings,
          ),
        ),

      compact:
        rgba(
          tintRgb,
          resolveSurfaceOpacity(
            opacity.compact,
            settings,
          ),
        ),
    },

    tint: {
      overlay:
        rgba(
          tintRgb,
          settings.tint === "none"
            ? 0
            : tintStrength * 0.22,
        ),
    },

    blur: {
      surface:
        `blur(${blurPixels}px)`,
    },

    border: {
      standard:
        settings.contrast === "soft"
          ? "rgba(255, 255, 255, 0.08)"
          : settings.contrast === "high"
            ? "rgba(255, 255, 255, 0.18)"
            : "rgba(255, 255, 255, 0.12)",

      emphasis:
        settings.contrast === "soft"
          ? "rgba(255, 255, 255, 0.12)"
          : settings.contrast === "high"
            ? "rgba(255, 255, 255, 0.26)"
            : "rgba(255, 255, 255, 0.18)",
    },

    shadow: {
      panel:
        `0 24px 80px -30px ${rgba(
          [0, 0, 0],
          resolveShadowAlpha(
            settings,
            1,
          ),
        )}`,

      hero:
        `0 40px 120px -45px ${rgba(
          [0, 0, 0],
          resolveShadowAlpha(
            settings,
            1.12,
          ),
        )}`,

      selected:
        `0 28px 90px -28px ${rgba(
          accentRgb,
          clamp(
            glowOpacity * 0.52,
            0,
            0.68,
          ),
        )}`,
    },

    radius: {
      surface:
        `${radius}px`,

      inner:
        `${Math.max(
          radius - 1,
          0,
        )}px`,
    },

    spacing: {
      compact:
        `${spacing.compact}rem`,

      standard:
        `${spacing.standard}rem`,

      relaxed:
        `${spacing.relaxed}rem`,
    },

    accent: {
      color:
        `rgb(${accentRgb[0]} ${accentRgb[1]} ${accentRgb[2]})`,

      rgb:
        rgbString(
          accentRgb,
        ),
    },

    glow: {
      surface:
        `0 0 ${Math.round(
          28 + glowOpacity * 52,
        )}px ${rgba(
          accentRgb,
          glowOpacity * 0.48,
        )}`,

      opacity:
        glowOpacity,
    },

    motion: {
      duration:
        settings.animation === "off"
          ? "0ms"
          : `${duration}ms`,

      scale:
        motionScale,
    },

    ambient: {
      opacity:
        percent(
          settings.ambient,
        ),

      motion:
        motionScale,

      transparency:
        percent(
          settings.transparency,
        ),
    },
  };
}
