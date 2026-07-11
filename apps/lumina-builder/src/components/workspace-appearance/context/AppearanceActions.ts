import type {
  WorkspaceAppearanceModel,
} from "../model";

export interface AppearanceActions {

  setMaterial(
    material: WorkspaceAppearanceModel["material"],
  ): void;

  setTint(
    tint: WorkspaceAppearanceModel["tint"],
  ): void;

  setTintStrength(
    value: number,
  ): void;

  setTransparency(
    value: number,
  ): void;

  setBlur(
    value: number,
  ): void;

  setDensity(
    density: WorkspaceAppearanceModel["density"],
  ): void;

  setSpacing(
    spacing: WorkspaceAppearanceModel["spacing"],
  ): void;

  setRadius(
    radius: WorkspaceAppearanceModel["radius"],
  ): void;

  reset(): void;
}
