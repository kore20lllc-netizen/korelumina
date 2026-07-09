export type LuminaThemeMode =
  | "dark"
  | "light";

export type LuminaMaterialMode =
  | "glass"
  | "solid"
  | "mica";

export type LuminaDensityMode =
  | "light"
  | "standard"
  | "dense"
  | "ultra";

export type LuminaContrastMode =
  | "standard"
  | "high";

export interface LuminaAppearanceSettings {
  theme: LuminaThemeMode;
  material: LuminaMaterialMode;
  density: LuminaDensityMode;
  contrast: LuminaContrastMode;
  ambient: number;
  motion: number;
  transparency: number;
}
