export type AppearanceMaterial =
  | "glass"
  | "solid"
  | "mica";

export type AppearanceTint =
  | "none"
  | "dark"
  | "frost"
  | "warm"
  | "cool";

export type AppearanceDensity =
  | "light"
  | "standard"
  | "dense"
  | "ultra";

export type AppearanceSpacing =
  | "compact"
  | "comfortable"
  | "relaxed";

export type AppearanceRadius =
  | "small"
  | "medium"
  | "large";

export type AppearanceElevation =
  | "flat"
  | "raised"
  | "floating";

export type AppearanceAccent =
  | "amber"
  | "blue"
  | "purple"
  | "emerald";

export type AppearanceContrast =
  | "soft"
  | "balanced"
  | "high";

export type AppearanceGlow =
  | "none"
  | "low"
  | "medium"
  | "high";

export type AppearanceAnimation =
  | "off"
  | "reduced"
  | "standard";

export interface WorkspaceAppearanceModel {
  material: AppearanceMaterial;
  tint: AppearanceTint;
  tintStrength: number;
  transparency: number;
  blur: number;
  shadowIntensity: number;
  glowIntensity: number;
  density: AppearanceDensity;
  spacing: AppearanceSpacing;
  radius: AppearanceRadius;
  elevation: AppearanceElevation;
  accent: AppearanceAccent;
  contrast: AppearanceContrast;
  glow: AppearanceGlow;
  animation: AppearanceAnimation;
  motion: number;
}
