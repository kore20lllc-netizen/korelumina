import type {
  LuminaAppearancePresetId,
} from "../registry";

import type {
  LuminaAppearanceSettings,
} from "../types";

export interface LuminaAppearanceController {
  settings: LuminaAppearanceSettings;

  updateSettings(
    patch: Partial<LuminaAppearanceSettings>,
  ): void;

  setSettings(
    settings: LuminaAppearanceSettings,
  ): void;

  applyPreset(
    presetId: LuminaAppearancePresetId,
  ): void;

  reset(): void;

  exportProfile(): string;

  importProfile(
    serializedProfile: string,
  ): void;
}
