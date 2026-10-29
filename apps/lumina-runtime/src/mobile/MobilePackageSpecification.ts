import type { RepositorySnapshot } from "../repository-intelligence/RepositorySnapshot.js";
import type { ProjectMetadata } from "../projects/projectMetadataStore.js";
import type { RuntimeCallerResolution } from "../routes/runtimeCaller.js";
import type { MobileTarget } from "./MobileCompatibility.js";

export const MOBILE_PACKAGE_SPECIFICATION_VERSION = "mobile-package-specification:v1" as const;
export type MobileNativeCapability = "network" | "camera" | "location";
export interface MobilePermissionDeclaration {
  readonly name: string;
  readonly rationale: string;
}
/** Runtime-only context. Never deserialize this from request bodies or cached client reports.
 * The caller must resolve projectId/repositoryRoot/metadata from the existing registry,
 * and acquire a fresh snapshot AFTER authorization. Validation is not execution approval.
 */
export interface MobilePackageValidationContext {
  readonly identity: RuntimeCallerResolution;
  readonly projectId: string;
  readonly repositoryRoot: string;
  readonly metadata: ProjectMetadata | null;
  readonly snapshot: RepositorySnapshot;
}
export interface MobilePackageSpecificationInput {
  readonly schemaVersion: typeof MOBILE_PACKAGE_SPECIFICATION_VERSION;
  readonly projectId: string;
  readonly applicationRoot: string;
  readonly target: MobileTarget;
  readonly applicationName: string;
  readonly applicationIdentifier: string;
  /** v1 deliberately uses three nonnegative decimal components on both platforms. */
  readonly version: string;
  /** Android versionCode is an integer; iOS CFBundleVersion is a decimal-component string. */
  readonly buildNumber: number | string;
  readonly sourceSnapshotFingerprint: string;
  readonly compatibilityReportFingerprint: string;
  readonly nativeCapabilities: readonly MobileNativeCapability[];
  readonly permissions: readonly MobilePermissionDeclaration[];
  readonly build: { readonly mode: "debug" | "release"; readonly webAssetsDirectory: string };
  readonly artifact: { readonly format: "apk" | "aab" | "ipa" | "simulator-app"; readonly signing: "unsigned" | "required" };
}
export interface MobilePackageSpecification extends MobilePackageSpecificationInput {
  readonly adapter: "capacitor";
  readonly compatibilityVersion: string;
  readonly framework: string;
  readonly buildVerification: "not-performed";
  readonly specificationFingerprint: string;
}
export type MobilePackageValidationErrorCode = "invalid_input" | "authentication_required" | "project_access_denied" |
  "project_identity_mismatch" | "snapshot_identity_mismatch" | "stale_snapshot" | "stale_compatibility" |
  "invalid_snapshot" | "ineligible_application" | "invalid_identifier" | "invalid_version" | "invalid_build_number" |
  "unsupported_capability" | "unsupported_permission" | "permission_capability_mismatch" | "invalid_build_configuration";
export class MobilePackageValidationError extends Error {
  constructor(readonly code: MobilePackageValidationErrorCode) {
    super(code);
    this.name = "MobilePackageValidationError";
  }
}
