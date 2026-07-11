import {
  useEffect,
} from "react";

import {
  useWorkspaceAppearance,
} from "../context";

import {
  useLuminaAppearance,
} from "@/components/lumina/appearance";

export function WorkspaceAppearanceAdapter() {
  const {
    appearance,
  } = useWorkspaceAppearance();

  const {
    updateSettings,
  } = useLuminaAppearance();

  useEffect(() => {
    updateSettings({
      material: appearance.material,

      density:
        appearance.density === "compact"
          ? "dense"
          : appearance.density === "comfortable"
            ? "standard"
            : "standard",

      contrast:
        appearance.contrast === "high"
          ? "high"
          : "standard",

      transparency:
        appearance.transparency,

      motion:
        appearance.motion,
    });
  }, [
    appearance,
    updateSettings,
  ]);

  return null;
}
