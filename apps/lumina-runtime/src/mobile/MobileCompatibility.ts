/** Static, versioned evidence only. Runtime remains the authority for execution. */
export const MOBILE_COMPATIBILITY_VERSION = "mobile-compatibility:v1" as const;
export type MobileClassification = "candidate" | "requires-adaptation" | "unsupported" | "unknown";
export type MobileTarget = "android" | "ios";
export type MobileFramework = "vite" | "react" | "vue" | "angular" | "svelte" | "next" | "nuxt" | "sveltekit" | "expo" | "react-native" | "native" | "static-web" | "backend" | "unknown";
export interface MobileEvidence {
  path: string;
  /** Stable reason, never a source excerpt, environment value, or command. */
  code: string;
}
export interface MobileFinding {
  code: string;
  path: string;
  recommendation: string;
}
export interface MobileApplicationCompatibility {
  root: string;
  framework: MobileFramework;
  adapter: "capacitor" | "expo" | "react-native" | "existing-native" | null;
  classification: MobileClassification;
  /** Presence of a native project prevents treating it as a fresh web wrapper. */
  nativeTargets: MobileTarget[];
  backendDependencies: string[];
  evidence: MobileEvidence[];
  blockers: MobileFinding[];
  recommendations: string[];
  targets: { target: MobileTarget; classification: MobileClassification; blockers: MobileFinding[] }[];
}
export interface MobileCompatibilityOptions {
  /** Canonical snapshot-relative directory; '.' selects the repository root. */
  applicationRoot?: string;
}
export interface MobileCompatibilityReport {
  version: typeof MOBILE_COMPATIBILITY_VERSION;
  snapshotFingerprint: string;
  reportFingerprint: string;
  monorepo: boolean;
  selectedApplicationRoot: string | null;
  selection: "selected" | "ambiguous" | "none";
  blockers: MobileFinding[];
  applications: MobileApplicationCompatibility[];
  /** Analysis never executes builds or certifies a distributable artifact. */
  buildVerification: "not-performed";
}
export class MobileCompatibilityInputError extends Error {
  constructor(readonly code: "invalid_snapshot" | "unsafe_path" | "duplicate_path" | "unreadable_evidence" | "evidence_mismatch", readonly evidencePath?: string) {
    super(evidencePath ? `${code}:${evidencePath}` : code);
    this.name = "MobileCompatibilityInputError";
  }
}
