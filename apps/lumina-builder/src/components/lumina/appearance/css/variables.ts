export const LUMINA_CSS_VARIABLES = {
  surface: {
    hero: "--lumina-surface-hero",
    panel: "--lumina-surface-panel",
    card: "--lumina-surface-card",
    interactive:
      "--lumina-surface-interactive",
    selected:
      "--lumina-surface-selected",
    compact:
      "--lumina-surface-compact",
  },

  border: {
    standard:
      "--lumina-border-standard",
    emphasis:
      "--lumina-border-emphasis",
  },

  shadow: {
    panel:
      "--lumina-shadow-panel",
    hero:
      "--lumina-shadow-hero",
    selected:
      "--lumina-shadow-selected",
  },

  blur: {
    surface:
      "--lumina-blur-surface",
  },

  ambient: {
    opacity:
      "--lumina-ambient-opacity",
    motion:
      "--lumina-ambient-motion",
    transparency:
      "--lumina-ambient-transparency",
  },
} as const;
