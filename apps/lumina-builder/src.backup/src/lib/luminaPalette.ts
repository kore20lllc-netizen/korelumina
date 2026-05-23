// Logo-matched palette rotation. Five hues sampled from lumina.png.
export const LUMINA_TILES = [
  "lumina-tile-rose",
  "lumina-tile-magenta",
  "lumina-tile-violet",
  "lumina-tile-cyan",
  "lumina-tile-gold",
] as const;

export const LUMINA_FRAMES = [
  "lumina-frame-rose",
  "lumina-frame-magenta",
  "lumina-frame-violet",
  "lumina-frame-cyan",
  "lumina-frame-gold",
] as const;

export const luminaTile = (i: number) => LUMINA_TILES[i % LUMINA_TILES.length];
export const luminaFrame = (i: number) => LUMINA_FRAMES[i % LUMINA_FRAMES.length];
