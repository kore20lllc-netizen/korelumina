import {
  useEffect,
} from "react";

import {
  useLuminaAppearance,
} from "@/components/lumina/appearance";

import {
  useWorkspaceAppearance,
} from "../context";

export function WorkspaceAppearanceAdapter() {
  const {
    state,
  } = useWorkspaceAppearance();

  const {
    updateSettings,
  } = useLuminaAppearance();

  useEffect(() => {
    updateSettings({
      material:
        state.material,

      tint:
        state.tint,

      tintStrength:
        state.tintStrength,

      transparency:
        state.transparency,

      blur:
        state.blur,

      shadowIntensity:
        state.shadowIntensity,

      glowIntensity:
        state.glowIntensity,

      density:
        state.density,

      spacing:
        state.spacing,

      radius:
        state.radius,

      elevation:
        state.elevation,

      accent:
        state.accent,

      contrast:
        state.contrast === "balanced"
          ? "standard"
          : state.contrast,

      glow:
        state.glow,

      animation:
        state.animation,

      motion:
        state.motion,
    });
  }, [
    state,
    updateSettings,
  ]);

  return null;
}
