import { createHash } from "node:crypto";
import { decideProjectAccess } from "../routes/projectAccess.js";
import { validateMobilePackageSpecification } from "./validateMobilePackageSpecification.js";
import type { MobilePackageSpecification, MobilePackageSpecificationInput, MobilePackageValidationContext } from "./MobilePackageSpecification.js";

export const MOBILE_BUILD_REQUEST_VERSION = "mobile-build-request:v1" as const;
export type MobileBuildFailure = "executor_unavailable" | "timeout" | "source_unavailable" | "dependency_failure" | "build_failure" | "artifact_verification_failed" | "internal_failure";
export type MobileBuildState = "queued" | "running" | "verifying" | "cancelling" | "completed" | "failed" | "cancelled";
export interface MobileBuildRequestInput {
  readonly projectId: string;
  readonly specificationFingerprint: string;
  readonly operation: "package";
  readonly idempotencyKey: string;
  readonly maxAttempts: number;
}
export interface MobileBuildRequest extends MobileBuildRequestInput {
  readonly schemaVersion: typeof MOBILE_BUILD_REQUEST_VERSION;
  readonly requestId: string;
  readonly requestFingerprint: string;
  readonly requestedBy: string;
  readonly applicationRoot: string;
  readonly applicationIdentifier: string;
  readonly target: "android" | "ios";
  readonly profile: "debug" | "release";
  readonly sourceSnapshotFingerprint: string;
  readonly sourceCommit: string | null;
  readonly compatibilityReportFingerprint: string;
}
export interface MobileArtifactEvidence {
  readonly reference: string;
  readonly requestId: string;
  readonly attemptId: string;
  readonly projectId: string;
  readonly target: "android" | "ios";
  readonly format: MobilePackageSpecification["artifact"]["format"];
  readonly applicationIdentifier: string;
  readonly version: string;
  readonly buildNumber: number | string;
  readonly sourceSnapshotFingerprint: string;
  readonly specificationFingerprint: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly verification: "verified";
  readonly signing: "verified" | "unsigned";
}
export interface MobileBuildAttempt {
  readonly attemptId: string;
  readonly number: number;
  readonly state: MobileBuildState;
  readonly diagnosticReferences: readonly string[];
  readonly failure: { readonly classification: MobileBuildFailure; readonly retryable: boolean } | null;
  readonly artifact: MobileArtifactEvidence | null;
}
export interface MobileBuildRecord {
  readonly request: MobileBuildRequest;
  readonly sequence: number;
  readonly attempts: readonly MobileBuildAttempt[];
  readonly distributionVerification: "not-performed";
}
/** Commands contain references, never artifact-verification assertions, raw logs, or credentials. */
export type MobileBuildCommand = { readonly expectedSequence: number; readonly attemptId: string } & (
  | { readonly type: "start" | "verify" | "cancel" | "cancelled" }
  | { readonly type: "diagnostic"; readonly reference: string }
  | { readonly type: "fail"; readonly reason: MobileBuildFailure }
  | { readonly type: "complete"; readonly artifactReference: string }
);
/** Runtime-owned lookup of independently verified evidence; never bind this to a client callback.
 * Future implementations must verify real stored bytes, provenance and signatures before returning.
 * There is deliberately no accepting default implementation.
 */
export type MobileArtifactVerifier = (reference: string, expected: Readonly<{
  request: MobileBuildRequest; attemptId: string; specification: MobilePackageSpecification;
}>) => MobileArtifactEvidence | null;
export class MobileBuildContractError extends Error {
  constructor(readonly code: "invalid_request" | "invalid_specification" | "project_mismatch" | "access_denied" | "idempotency_conflict" | "request_not_found" | "stale_transition" | "invalid_transition" | "artifact_not_verified" | "retry_denied" | "capacity_exceeded") {
    super(code); this.name = "MobileBuildContractError";
  }
}
export function mobileBuildContractFailure(code: MobileBuildContractError["code"]): never { throw new MobileBuildContractError(code); }
export function mobileBuildCanonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(mobileBuildCanonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${mobileBuildCanonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export const mobileBuildHash = (value: unknown): string => createHash("sha256").update(mobileBuildCanonical(value)).digest("hex");
export function freezeMobileBuildValue<T>(value: T): T {
  if (value !== null && typeof value === "object") { Object.values(value).forEach(freezeMobileBuildValue); Object.freeze(value); }
  return value;
}
/** Strict JSON-like records reject extra fields and executable accessors. */
export function mobileBuildFields(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return mobileBuildContractFailure("invalid_request");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !descriptors[key] || !("value" in descriptors[key]))) return mobileBuildContractFailure("invalid_request");
  return value as Record<string, unknown>;
}
export const mobileBuildReference = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,127}$/.test(value);
export function authorizeMobileBuild(context: MobilePackageValidationContext, projectId: string, action: "view" | "manage"): void {
  if (context.projectId !== projectId || !context.metadata || context.metadata.projectId !== projectId) return mobileBuildContractFailure("project_mismatch");
  if (!context.identity?.caller.userId || !["verified-token", "internal-token"].includes(context.identity.source) || !decideProjectAccess(context.identity.caller, context.metadata, action).ok) return mobileBuildContractFailure("access_denied");
}
/** Revalidate accepted immutable evidence rather than trusting a client fingerprint or readonly type. */
export function revalidateMobileBuildSpecification(specification: MobilePackageSpecification, context: MobilePackageValidationContext): MobilePackageSpecification {
  const frozen = (value: unknown): boolean => value === null || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen));
  if (!specification || !frozen(specification)) return mobileBuildContractFailure("invalid_specification");
  const generated = ["adapter", "framework", "compatibilityVersion", "buildVerification", "specificationFingerprint"];
  const input = Object.fromEntries(Object.entries(specification).filter(([key]) => !generated.includes(key)));
  let verified: MobilePackageSpecification;
  try { verified = validateMobilePackageSpecification(input, context); }
  catch { return mobileBuildContractFailure("invalid_specification"); }
  if (mobileBuildCanonical(verified) !== mobileBuildCanonical(specification)) return mobileBuildContractFailure("invalid_specification");
  return verified;
}
export function createMobileBuildRequest(input: unknown, specification: MobilePackageSpecification, context: MobilePackageValidationContext): MobileBuildRequest {
  const value = mobileBuildFields(input, ["projectId", "specificationFingerprint", "operation", "idempotencyKey", "maxAttempts"]);
  if (typeof value.projectId !== "string") return mobileBuildContractFailure("invalid_request");
  authorizeMobileBuild(context, value.projectId, "manage");
  const accepted = revalidateMobileBuildSpecification(specification, context);
  if (value.specificationFingerprint !== accepted.specificationFingerprint || value.projectId !== accepted.projectId) return mobileBuildContractFailure("invalid_specification");
  if (value.operation !== "package" || !mobileBuildReference(value.idempotencyKey) || !Number.isSafeInteger(value.maxAttempts) || (value.maxAttempts as number) < 1 || (value.maxAttempts as number) > 3) return mobileBuildContractFailure("invalid_request");
  const body = { schemaVersion: MOBILE_BUILD_REQUEST_VERSION, projectId: accepted.projectId, specificationFingerprint: accepted.specificationFingerprint,
    operation: "package" as const, idempotencyKey: value.idempotencyKey, maxAttempts: value.maxAttempts as number, requestedBy: context.identity.caller.userId!,
    applicationRoot: accepted.applicationRoot, applicationIdentifier: accepted.applicationIdentifier, target: accepted.target, profile: accepted.build.mode,
    sourceSnapshotFingerprint: accepted.sourceSnapshotFingerprint, sourceCommit: context.snapshot.commit, compatibilityReportFingerprint: accepted.compatibilityReportFingerprint };
  const requestFingerprint = mobileBuildHash(body);
  return freezeMobileBuildValue({ ...body, requestFingerprint, requestId: `mobile-request:${requestFingerprint}` });
}
/** Stable classifications only; never infer retry policy from arbitrary exception text. */
export function classifyMobileBuildFailure(reason: unknown): { readonly classification: MobileBuildFailure; readonly retryable: boolean } {
  const reasons: MobileBuildFailure[] = ["executor_unavailable", "timeout", "source_unavailable", "dependency_failure", "build_failure", "artifact_verification_failed", "internal_failure"];
  const classification = reasons.includes(reason as MobileBuildFailure) ? reason as MobileBuildFailure : "internal_failure";
  return Object.freeze({ classification, retryable: ["executor_unavailable", "timeout", "source_unavailable"].includes(classification) });
}
