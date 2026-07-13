import type {
  WorkspaceAppearanceModel,
} from "../model";

export interface AppearanceSelectors {
  isTransparent: boolean;
  isAnimated: boolean;
  usesBackdropBlur: boolean;
}

export function createAppearanceSelectors(
  state: WorkspaceAppearanceModel,
): AppearanceSelectors {
  return {
    isTransparent:
      state.material !== "solid" &&
      state.transparency > 0,

    isAnimated:
      state.animation !== "off" &&
      state.motion > 0,

    usesBackdropBlur:
      state.material !== "solid" &&
      state.blur > 0,
  };
}
