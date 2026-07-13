import type {
  LuminaAppearanceSettings,
} from "./types";

export const DEFAULT_LUMINA_APPEARANCE:
  LuminaAppearanceSettings = {
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
  };
