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

export interface WorkspaceAppearanceModel {
  material: AppearanceMaterial;

  tint: AppearanceTint;

  tintStrength: number;

  transparency: number;

  blur: number;

  density: string;

  spacing: string;

  radius: string;

  elevation: string;

  accent: string;

  contrast: string;

  glow: string;

  animation: string;

  motion: number;
}
