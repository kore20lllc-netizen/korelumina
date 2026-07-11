export interface LuminaResolvedAppearance {
  surface: {
    hero: string;
    panel: string;
    card: string;
    interactive: string;
    selected: string;
    compact: string;
  };

  tint: {
    overlay: string;
  };

  blur: {
    surface: string;
  };

  border: {
    standard: string;
    emphasis: string;
  };

  shadow: {
    panel: string;
    hero: string;
    selected: string;
    hover: string;
  };

  highlight: {
    overlay: string;
  };

  radius: {
    surface: string;
    inner: string;
  };

  spacing: {
    compact: string;
    standard: string;
    relaxed: string;
  };

  accent: {
    color: string;
    rgb: string;
  };

  glow: {
    surface: string;
    opacity: number;
  };

  motion: {
    duration: string;
    scale: number;
  };

  ambient: {
    primary: string;
    secondary: string;
    opacity: number;
    motion: number;
    transparency: number;
  };
}
