import {
  DEFAULT_LUMINA_APPEARANCE,
} from "./defaults";

import type {
  LuminaAppearanceSettings,
} from "./types";

const STORAGE_KEY =
  "korelumina:appearance";

export function readLuminaAppearance():
  LuminaAppearanceSettings {
  if (typeof window === "undefined") {
    return DEFAULT_LUMINA_APPEARANCE;
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_LUMINA_APPEARANCE;
    }

    return {
      ...DEFAULT_LUMINA_APPEARANCE,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_LUMINA_APPEARANCE;
  }
}

export function writeLuminaAppearance(
  settings: LuminaAppearanceSettings,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings),
  );
}
