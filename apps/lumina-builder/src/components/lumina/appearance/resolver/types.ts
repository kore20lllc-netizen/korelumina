export interface LuminaResolvedAppearance {
  surface: {
    hero: string;
    panel: string;
    card: string;
    interactive: string;
    selected: string;
    compact: string;
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
  };

  ambient: {
    opacity: number;
    motion: number;
    transparency: number;
  };
}
