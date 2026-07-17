import type {
  LuminaMaterialMode,
} from "../types";

export type LuminaRgb = readonly [
  number,
  number,
  number,
];

export interface LuminaMaterialDefinition {
  id: LuminaMaterialMode;
  label: string;
  description: string;

  colors: {
    base: LuminaRgb;
    ambientPrimary: LuminaRgb;
    ambientSecondary: LuminaRgb;
    border: LuminaRgb;
  };

  optics: {
    opacity: number;
    blur: number;
    saturation: number;
    contrast: number;
    brightness: number;
    layerOpacity: number;
  };
}

export const LUMINA_MATERIALS:
  Record<
    LuminaMaterialMode,
    LuminaMaterialDefinition
  > = {
    glass: {
      id: "glass",
      label: "Glass",
      description:
        "Transparent layered surfaces with blur and ambient depth.",

      colors: {
        base: [
          18,
          22,
          48,
        ],

        ambientPrimary: [
          76,
          98,
          255,
        ],

        ambientSecondary: [
          170,
          98,
          255,
        ],

        border: [
          255,
          255,
          255,
        ],
      },

      optics: {
        opacity: 1,
        blur: 0.64,
        saturation: 1.18,
        contrast: 1.02,
        brightness: 1.02,
        layerOpacity: 1,
      },
    },

    solid: {
      id: "solid",
      label: "Solid",
      description:
        "Darker, more opaque surfaces optimized for operational clarity.",

      colors: {
        base: [
          15,
          18,
          28,
        ],

        ambientPrimary: [
          59,
          130,
          246,
        ],

        ambientSecondary: [
          139,
          92,
          246,
        ],

        border: [
          255,
          255,
          255,
        ],
      },

      optics: {
        opacity: 2.5,
        blur: 0.08,
        saturation: 1,
        contrast: 1,
        brightness: 1,
        layerOpacity: 0.18,
      },
    },

    mica: {
      id: "mica",
      label: "Mica",
      description:
        "Softly diffused surfaces with stronger blur and calmer contrast.",

      colors: {
        base: [
          30,
          35,
          58,
        ],

        ambientPrimary: [
          96,
          112,
          255,
        ],

        ambientSecondary: [
          184,
          116,
          255,
        ],

        border: [
          255,
          255,
          255,
        ],
      },

      optics: {
        opacity: 0.88,
        blur: 0.92,
        saturation: 1.32,
        contrast: 1.08,
        brightness: 1.05,
        layerOpacity: 0.86,
      },
    },
  };
