import type {
  LuminaMaterialMode,
} from "../types";

export interface LuminaMaterialDefinition {
  id: LuminaMaterialMode;
  label: string;
  description: string;
}

export const LUMINA_MATERIALS:
  Record<LuminaMaterialMode, LuminaMaterialDefinition> = {
    glass: {
      id: "glass",
      label: "Glass",
      description:
        "Transparent layered surfaces with blur and ambient depth.",
    },

    solid: {
      id: "solid",
      label: "Solid",
      description:
        "Darker, more opaque surfaces optimized for operational clarity.",
    },

    mica: {
      id: "mica",
      label: "Mica",
      description:
        "Softly diffused surfaces with stronger blur and calmer contrast.",
    },
  };
