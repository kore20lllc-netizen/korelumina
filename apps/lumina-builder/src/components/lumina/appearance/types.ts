export type LuminaThemeMode =
  | "dark"
  | "light";

export type LuminaMaterialMode =
  | "glass"
  | "solid"
  | "mica";

export type LuminaTintMode =
  | "none"
  | "dark"
  | "frost"
  | "warm"
  | "cool";

export type LuminaDensityMode =
  | "light"
  | "standard"
  | "dense"
  | "ultra";

export type LuminaSpacingMode =
  | "compact"
  | "comfortable"
  | "relaxed";

export type LuminaRadiusMode =
  | "small"
  | "medium"
  | "large";

export type LuminaElevationMode =
  | "flat"
  | "raised"
  | "floating";

export type LuminaAccentMode =
  | "amber"
  | "blue"
  | "purple"
  | "emerald";

export type LuminaContrastMode =
  | "soft"
  | "standard"
  | "high";

export type LuminaGlowMode =
  | "none"
  | "low"
  | "medium"
  | "high";

export type LuminaAnimationMode =
  | "off"
  | "reduced"
  | "standard";

export interface LuminaAppearanceSettings {
  theme: LuminaThemeMode;
  material: LuminaMaterialMode;

  tint: LuminaTintMode;
  tintStrength: number;

  transparency: number;
  blur: number;
  shadowIntensity: number;
  glowIntensity: number;

  density: LuminaDensityMode;
  spacing: LuminaSpacingMode;
  radius: LuminaRadiusMode;
  elevation: LuminaElevationMode;

  accent: LuminaAccentMode;
  contrast: LuminaContrastMode;
  glow: LuminaGlowMode;

  animation: LuminaAnimationMode;
  ambient: number;
  motion: number;
}
