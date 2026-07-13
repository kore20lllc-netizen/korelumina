import type {
  LuminaResolvedAppearance,
} from "./types";

export type LuminaSurfaceVariant =
  | "hero"
  | "panel"
  | "card"
  | "interactive"
  | "selected"
  | "compact";

export function resolveSurface(
  variant: LuminaSurfaceVariant,
  appearance: LuminaResolvedAppearance,
) {
  return [
    appearance.surface[variant],
    appearance.blur.surface,
  ].join(" ");
}
