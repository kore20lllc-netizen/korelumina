/**
 * Certified Lumina motion recipes.
 *
 * Durations and curves resolve through semantic CSS variables with safe
 * production fallbacks. Components consume these recipes rather than
 * declaring independent animation values.
 */
export const luminaMotion = {
  surface: [
    "transition-[background,border-color,box-shadow,transform,backdrop-filter]",
    "[transition-duration:var(--lumina-motion-duration,300ms)]",
    "[transition-timing-function:var(--lumina-motion-easing-standard,cubic-bezier(0.22,1,0.36,1))]",
    "motion-reduce:transform-none",
    "motion-reduce:transition-none",
  ].join(" "),

  reflection: [
    "before:transition-opacity",
    "before:[transition-duration:var(--lumina-motion-duration,300ms)]",
    "before:[transition-timing-function:var(--lumina-motion-easing-standard,cubic-bezier(0.22,1,0.36,1))]",
    "motion-reduce:before:transition-none",
  ].join(" "),

  fast: [
    "[transition-duration:var(--lumina-motion-duration-fast,150ms)]",
    "[transition-timing-function:var(--lumina-motion-easing-standard,cubic-bezier(0.22,1,0.36,1))]",
    "motion-reduce:transition-none",
  ].join(" "),

  standard: [
    "[transition-duration:var(--lumina-motion-duration,300ms)]",
    "[transition-timing-function:var(--lumina-motion-easing-standard,cubic-bezier(0.22,1,0.36,1))]",
    "motion-reduce:transition-none",
  ].join(" "),

  deliberate: [
    "[transition-duration:var(--lumina-motion-duration-deliberate,500ms)]",
    "[transition-timing-function:var(--lumina-motion-easing-emphasized,cubic-bezier(0.16,1,0.3,1))]",
    "motion-reduce:transition-none",
  ].join(" "),

  press: [
    "active:[transition-duration:var(--lumina-motion-duration-fast,150ms)]",
    "active:[transition-timing-function:var(--lumina-motion-easing-standard,cubic-bezier(0.22,1,0.36,1))]",
    "motion-reduce:transform-none",
  ].join(" "),
} as const;

export type LuminaMotionKey =
  keyof typeof luminaMotion;

export default luminaMotion;
