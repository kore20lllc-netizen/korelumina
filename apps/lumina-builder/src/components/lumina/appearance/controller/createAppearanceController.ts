import {
  DEFAULT_LUMINA_APPEARANCE,
} from "../defaults";

import {
  LUMINA_APPEARANCE_PRESETS,
  type LuminaAppearancePresetId,
} from "../registry";

import type {
  LuminaAppearanceSettings,
} from "../types";

import type {
  LuminaAppearanceController,
} from "./types";

export function createAppearanceController({
  settings,
  setSettings,
}: {
  settings: LuminaAppearanceSettings;
  setSettings(
    settings: LuminaAppearanceSettings,
  ): void;
}): LuminaAppearanceController {
  return {
    settings,

    updateSettings(
      patch: Partial<LuminaAppearanceSettings>,
    ) {
      setSettings({
        ...settings,
        ...patch,
      });
    },

    setSettings,

    applyPreset(
      presetId: LuminaAppearancePresetId,
    ) {
      const preset =
        LUMINA_APPEARANCE_PRESETS[presetId];

      setSettings(preset.settings);
    },

    reset() {
      setSettings(DEFAULT_LUMINA_APPEARANCE);
    },

    exportProfile() {
      return JSON.stringify(
        settings,
        null,
        2,
      );
    },

    importProfile(
      serializedProfile: string,
    ) {
      const parsed =
        JSON.parse(
          serializedProfile,
        );

      setSettings({
        ...DEFAULT_LUMINA_APPEARANCE,
        ...parsed,
      });
    },
  };
}
