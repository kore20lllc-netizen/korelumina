import type {
  LuminaResolvedAppearance,
} from "../resolver";

import {
  LUMINA_CSS_VARIABLES,
} from "./variables";

export function applyAppearance(
  appearance: LuminaResolvedAppearance,
) {
  if (
    typeof document === "undefined"
  ) {
    return;
  }

  const root =
    document.documentElement.style;

  try {
    root.setProperty(
      LUMINA_CSS_VARIABLES.surface.hero,
      appearance.surface.hero,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.surface.panel,
      appearance.surface.panel,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.surface.card,
      appearance.surface.card,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.surface.interactive,
      appearance.surface.interactive,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.surface.selected,
      appearance.surface.selected,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.surface.compact,
      appearance.surface.compact,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.tint.overlay,
      appearance.tint.overlay,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.highlight.overlay,
      appearance.highlight.overlay,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.blur.surface,
      appearance.blur.surface,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.material.saturation,
      appearance.material.saturation,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.material.contrast,
      appearance.material.contrast,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.material.brightness,
      appearance.material.brightness,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.material.layerOpacity,
      String(
        appearance.material.layerOpacity,
      ),
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.border.standard,
      appearance.border.standard,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.border.emphasis,
      appearance.border.emphasis,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.shadow.panel,
      appearance.shadow.panel,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.shadow.hero,
      appearance.shadow.hero,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.shadow.selected,
      appearance.shadow.selected,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.shadow.hover,
      appearance.shadow.hover,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.elevation.level,
      String(
        appearance.elevation.level,
      ),
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.radius.surface,
      appearance.radius.surface,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.radius.inner,
      appearance.radius.inner,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.spacing.compact,
      appearance.spacing.compact,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.spacing.standard,
      appearance.spacing.standard,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.spacing.relaxed,
      appearance.spacing.relaxed,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.accent.color,
      appearance.accent.color,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.accent.rgb,
      appearance.accent.rgb,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.glow.surface,
      appearance.glow.surface,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.glow.opacity,
      String(
        appearance.glow.opacity,
      ),
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.motion.duration,
      appearance.motion.duration,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.motion.scale,
      String(
        appearance.motion.scale,
      ),
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.ambient.primary,
      appearance.ambient.primary,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.ambient.secondary,
      appearance.ambient.secondary,
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.ambient.opacity,
      String(
        appearance.ambient.opacity,
      ),
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.ambient.motion,
      String(
        appearance.ambient.motion,
      ),
    );

    root.setProperty(
      LUMINA_CSS_VARIABLES.ambient.transparency,
      String(
        appearance.ambient.transparency,
      ),
    );
  } catch (error) {
    console.error(
      "applyAppearance failed",
      error,
      appearance,
    );

    throw error;
  }
}
