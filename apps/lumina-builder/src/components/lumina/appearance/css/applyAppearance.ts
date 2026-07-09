import {
  LUMINA_CSS_VARIABLES,
} from "./variables";

import type {
  LuminaResolvedAppearance,
} from "../resolver";

export function applyAppearance(
  appearance: LuminaResolvedAppearance,
) {
  if (typeof document === "undefined") {
    return;
  }

  const root =
    document.documentElement.style;

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
    LUMINA_CSS_VARIABLES.blur.surface,
    appearance.blur.surface,
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
}
