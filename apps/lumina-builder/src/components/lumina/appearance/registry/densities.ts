import type {
  LuminaDensityMode,
} from "../types";

export interface LuminaDensityDefinition {
  id: LuminaDensityMode;
  label: string;
  description: string;
}

export const LUMINA_DENSITIES:
  Record<LuminaDensityMode, LuminaDensityDefinition> = {
    light: {
      id: "light",
      label: "Light",
      description:
        "Airier presentation with lower opacity and more ambience.",
    },

    standard: {
      id: "standard",
      label: "Standard",
      description:
        "Balanced default for most KoreLumina workspaces.",
    },

    dense: {
      id: "dense",
      label: "Dense",
      description:
        "Stronger surfaces and higher readability for engineering workflows.",
    },

    ultra: {
      id: "ultra",
      label: "Ultra",
      description:
        "Maximum density and contrast for operations and monitoring.",
    },
  };
