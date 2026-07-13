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
  Record<
    LuminaAppearancePresetId,
    LuminaAppearancePreset
  > = {
    lumina: {
      id: "lumina",
      label: "Lumina",
      description:
        "Balanced glass appearance with the default KoreLumina atmosphere.",
      audience: "default",
      settings: {
        theme: "dark",
        material: "glass",
        tint: "dark",
        tintStrength: 65,
        transparency: 55,
        blur: 70,
        shadowIntensity: 45,
        glowIntensity: 35,
        density: "standard",
        spacing: "comfortable",
        radius: "large",
        elevation: "floating",
        accent: "amber",
        contrast: "standard",
        glow: "medium",
        animation: "standard",
        ambient: 75,
        motion: 35,
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
        tint: "dark",
        tintStrength: 82,
        transparency: 18,
        blur: 18,
        shadowIntensity: 38,
        glowIntensity: 16,
        density: "dense",
        spacing: "compact",
        radius: "medium",
        elevation: "raised",
        accent: "purple",
        contrast: "standard",
        glow: "low",
        animation: "reduced",
        ambient: 35,
        motion: 28,
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
        tint: "dark",
        tintStrength: 92,
        transparency: 6,
        blur: 8,
        shadowIntensity: 24,
        glowIntensity: 0,
        density: "ultra",
        spacing: "compact",
        radius: "small",
        elevation: "flat",
        accent: "blue",
        contrast: "high",
        glow: "none",
        animation: "reduced",
        ambient: 12,
        motion: 18,
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
        tint: "cool",
        tintStrength: 72,
        transparency: 30,
        blur: 82,
        shadowIntensity: 42,
        glowIntensity: 24,
        density: "dense",
        spacing: "comfortable",
        radius: "large",
        elevation: "floating",
        accent: "purple",
        contrast: "standard",
        glow: "low",
        animation: "reduced",
        ambient: 22,
        motion: 25,
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
        tint: "frost",
        tintStrength: 62,
        transparency: 48,
        blur: 76,
        shadowIntensity: 32,
        glowIntensity: 18,
        density: "standard",
        spacing: "comfortable",
        radius: "large",
        elevation: "raised",
        accent: "blue",
        contrast: "standard",
        glow: "low",
        animation: "standard",
        ambient: 65,
        motion: 32,
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
        tint: "warm",
        tintStrength: 48,
        transparency: 64,
        blur: 72,
        shadowIntensity: 55,
        glowIntensity: 48,
        density: "light",
        spacing: "relaxed",
        radius: "large",
        elevation: "floating",
        accent: "amber",
        contrast: "standard",
        glow: "high",
        animation: "standard",
        ambient: 85,
        motion: 60,
      },
    },
  };
