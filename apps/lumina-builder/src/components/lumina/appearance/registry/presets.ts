import type {
  LuminaAppearanceSettings,
} from "../types";

export type LuminaAppearancePresetId =
  | "lumina"
  | "studio"
  | "enterprise"
  | "midnight"
  | "frost"
  | "presentation";

export interface LuminaAppearancePreset {
  id: LuminaAppearancePresetId;
  label: string;
  description: string;
  audience:
    | "default"
    | "developer"
    | "operations"
    | "presentation";
  settings: LuminaAppearanceSettings;
}

export const LUMINA_APPEARANCE_PRESETS:
  Record<LuminaAppearancePresetId, LuminaAppearancePreset> = {
    lumina: {
      id: "lumina",
      label: "Lumina",
      description:
        "Balanced glass appearance with the default KoreLumina atmosphere.",
      audience: "default",
      settings: {
        theme: "dark",
        material: "glass",
        density: "standard",
        contrast: "standard",
        ambient: 75,
        motion: 70,
        transparency: 55,
      },
    },

    studio: {
      id: "studio",
      label: "Studio",
      description:
        "Darker and denser appearance for long engineering sessions.",
      audience: "developer",
      settings: {
        theme: "dark",
        material: "solid",
        density: "dense",
        contrast: "standard",
        ambient: 35,
        motion: 45,
        transparency: 25,
      },
    },

    enterprise: {
      id: "enterprise",
      label: "Enterprise",
      description:
        "Maximum clarity with minimal ambient distraction.",
      audience: "operations",
      settings: {
        theme: "dark",
        material: "solid",
        density: "ultra",
        contrast: "high",
        ambient: 12,
        motion: 25,
        transparency: 8,
      },
    },

    midnight: {
      id: "midnight",
      label: "Midnight",
      description:
        "Dark, calm, OLED-friendly workspace appearance.",
      audience: "developer",
      settings: {
        theme: "dark",
        material: "mica",
        density: "dense",
        contrast: "standard",
        ambient: 22,
        motion: 35,
        transparency: 20,
      },
    },

    frost: {
      id: "frost",
      label: "Frost",
      description:
        "Light glass appearance for brighter environments.",
      audience: "default",
      settings: {
        theme: "light",
        material: "glass",
        density: "standard",
        contrast: "standard",
        ambient: 65,
        motion: 65,
        transparency: 50,
      },
    },

    presentation: {
      id: "presentation",
      label: "Presentation",
      description:
        "Lighter, more spacious appearance for demos and reviews.",
      audience: "presentation",
      settings: {
        theme: "dark",
        material: "glass",
        density: "light",
        contrast: "standard",
        ambient: 85,
        motion: 80,
        transparency: 65,
      },
    },
  };
