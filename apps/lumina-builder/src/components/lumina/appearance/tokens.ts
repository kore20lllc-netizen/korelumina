import {
  DEFAULT_LUMINA_APPEARANCE,
} from "./defaults";

import {
  densitySurfaceProfiles,
  materialBlurProfiles,
} from "./profiles";

import type {
  LuminaAppearanceSettings,
} from "./types";

export function getLuminaSurfaceClass(
  variant:
    | "hero"
    | "panel"
    | "card"
    | "interactive"
    | "selected"
    | "compact",
  settings: LuminaAppearanceSettings =
    DEFAULT_LUMINA_APPEARANCE,
) {
  const surface =
    densitySurfaceProfiles[settings.density][variant];

  const blur =
    materialBlurProfiles[settings.material];

  return `${surface} ${blur}`;
}
