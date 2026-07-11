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

      density:
        state.density,

      contrast:
        state.contrast === "high"
          ? "high"
          : "standard",

      transparency:
        state.transparency,

      motion:
        state.animation === "off"
          ? 0
          : state.animation === "reduced"
            ? Math.min(
                state.motion,
                35,
              )
            : state.motion,
    });
  }, [
    state,
    updateSettings,
  ]);

  return null;
}
