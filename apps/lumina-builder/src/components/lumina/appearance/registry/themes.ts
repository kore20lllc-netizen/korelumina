import type {
  LuminaThemeMode,
} from "../types";

export interface LuminaThemeDefinition {
  id: LuminaThemeMode;
  label: string;
  description: string;
}

export const LUMINA_THEMES:
  Record<LuminaThemeMode, LuminaThemeDefinition> = {
    dark: {
      id: "dark",
      label: "Lumina Dark",
      description:
        "Default dark operating environment for KoreLumina workspaces.",
    },

    light: {
      id: "light",
      label: "Lumina Light",
      description:
        "Bright workspace environment for high-light settings.",
    },
  };
