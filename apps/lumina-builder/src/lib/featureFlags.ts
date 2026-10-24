/**
 * Lightweight client-side feature flag registry.
 *
 * Flags can be overridden at runtime via localStorage:
 *   localStorage.setItem("ff:transform_to_website", "false")
 *
 * Or globally via window.__FLAGS__ (e.g. set by a future server bootstrap).
 */

export type FeatureFlag = "transform_to_website";

/* MS-2026-0011: Transform runs on Runtime's real engine; the separate "real engine" flag is gone. */
const DEFAULTS: Record<FeatureFlag, boolean> = {
  transform_to_website: true,
};

declare global {
  interface Window {
    __FLAGS__?: Partial<Record<FeatureFlag, boolean>>;
  }
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (typeof window !== "undefined") {
    const ls = window.localStorage?.getItem(`ff:${flag}`);
    if (ls === "true") return true;
    if (ls === "false") return false;
    const w = window.__FLAGS__?.[flag];
    if (typeof w === "boolean") return w;
  }
  return DEFAULTS[flag];
}

export function setFeatureFlagOverride(flag: FeatureFlag, value: boolean | null) {
  if (typeof window === "undefined") return;
  if (value === null) window.localStorage.removeItem(`ff:${flag}`);
  else window.localStorage.setItem(`ff:${flag}`, String(value));
}
