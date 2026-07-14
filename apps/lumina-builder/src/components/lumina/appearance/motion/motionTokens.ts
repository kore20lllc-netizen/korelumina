/**
 * Canonical Lumina motion design tokens.
 *
 * These tokens define motion semantics. Components consume motion
 * recipes from motionClasses.ts rather than embedding raw timing values.
 */
export const luminaMotionTokens = {
  duration: {
    fast: {
      variable:
        "--lumina-motion-duration-fast",
      fallback: "150ms",
    },

    standard: {
      variable:
        "--lumina-motion-duration",
      fallback: "300ms",
    },

    deliberate: {
      variable:
        "--lumina-motion-duration-deliberate",
      fallback: "500ms",
    },
  },

  easing: {
    standard: {
      variable:
        "--lumina-motion-easing-standard",
      fallback:
        "cubic-bezier(0.22,1,0.36,1)",
    },

    emphasized: {
      variable:
        "--lumina-motion-easing-emphasized",
      fallback:
        "cubic-bezier(0.16,1,0.3,1)",
    },
  },

  scale: {
    variable:
      "--lumina-motion-scale",
    fallback: "1",
  },
} as const;

export type LuminaMotionDuration =
  keyof typeof luminaMotionTokens.duration;

export type LuminaMotionEasing =
  keyof typeof luminaMotionTokens.easing;

export default luminaMotionTokens;
