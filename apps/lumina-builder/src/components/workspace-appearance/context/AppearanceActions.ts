import type {
  WorkspaceAppearanceModel,
} from "../model";

export interface AppearanceActions {
  setMaterial(
    value: WorkspaceAppearanceModel["material"],
  ): void;

  setTint(
    value: WorkspaceAppearanceModel["tint"],
  ): void;

  setTintStrength(value: number): void;

  setTransparency(value: number): void;

  setBlur(value: number): void;

  setShadowIntensity(value: number): void;

  setGlowIntensity(value: number): void;

  setDensity(
    value: WorkspaceAppearanceModel["density"],
  ): void;

  setSpacing(
    value: WorkspaceAppearanceModel["spacing"],
  ): void;

  setRadius(
    value: WorkspaceAppearanceModel["radius"],
  ): void;

  setElevation(
    value: WorkspaceAppearanceModel["elevation"],
  ): void;

  setAccent(
    value: WorkspaceAppearanceModel["accent"],
  ): void;

  setContrast(
    value: WorkspaceAppearanceModel["contrast"],
  ): void;

  setGlow(
    value: WorkspaceAppearanceModel["glow"],
  ): void;

  setAnimation(
    value: WorkspaceAppearanceModel["animation"],
  ): void;

  setMotion(value: number): void;

  reset(): void;
}
