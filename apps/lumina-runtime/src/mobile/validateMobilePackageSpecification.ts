import { createHash } from "node:crypto";
import path from "node:path";
import { decideProjectAccess } from "../routes/projectAccess.js";
import { analyzeMobileCompatibility } from "./analyzeMobileCompatibility.js";
import {
  MOBILE_PACKAGE_SPECIFICATION_VERSION, MobilePackageValidationError,
  type MobilePackageValidationErrorCode, type MobilePackageValidationContext,
  type MobilePackageSpecification, type MobilePackageSpecificationInput, type MobileNativeCapability,
} from "./MobilePackageSpecification.js";

const fail = (code: MobilePackageValidationErrorCode): never => { throw new MobilePackageValidationError(code); };
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return fail("invalid_input");
  const entries = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !entries[key] || !("value" in entries[key])) || Object.keys(entries).some(key => !keys.includes(key))) return fail("invalid_input");
  return value as Record<string, unknown>;
}
function array(value: unknown, limit: number): unknown[] {
  if (!Array.isArray(value) || value.length > limit || Object.getPrototypeOf(value) !== Array.prototype ||
    Reflect.ownKeys(value).length !== value.length + 1) return fail("invalid_input");
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, i);
    if (!descriptor || !("value" in descriptor)) return fail("invalid_input");
  }
  return value;
}
const text = (value: unknown, maximum: number): value is string => typeof value === "string" && value.length > 0 && value.length <= maximum && value.trim() === value && !/[\x00-\x1f\x7f]/.test(value);
const relative = (value: unknown): value is string => text(value, 4096) && !/[\\:%]/.test(value) && !value.split("/").some(part => !part || part === "." || part === "..");
const digest = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
/** Key-sorted JSON; arrays representing sets are sorted by the validator before hashing. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort(compare).map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
}

/** Pure validation of Runtime-owned evidence. No disk, process, configuration evaluation, or network. */
export function validateMobilePackageSpecification(input: unknown, context: MobilePackageValidationContext): MobilePackageSpecification {
  const value = record(input, ["schemaVersion", "projectId", "applicationRoot", "target", "applicationName", "applicationIdentifier", "version", "buildNumber", "sourceSnapshotFingerprint", "compatibilityReportFingerprint", "nativeCapabilities", "permissions", "build", "artifact"]);
  if (value.schemaVersion !== MOBILE_PACKAGE_SPECIFICATION_VERSION || !text(value.projectId, 128) || !/^[a-zA-Z0-9._-]+$/.test(value.projectId) || [".", ".."].includes(value.projectId) ||
    !(value.applicationRoot === "." || relative(value.applicationRoot)) || !["android", "ios"].includes(value.target as string) || !text(value.applicationName, 80) ||
    !digest(value.sourceSnapshotFingerprint) || !digest(value.compatibilityReportFingerprint)) return fail("invalid_input");
  const identity = context.identity;
  if (!identity?.caller.userId || !["verified-token", "internal-token"].includes(identity.source)) return fail("authentication_required");
  if (context.projectId !== value.projectId || !context.metadata || context.metadata.projectId !== context.projectId) return fail("project_identity_mismatch");
  if (!decideProjectAccess(identity.caller, context.metadata, "view").ok) return fail("project_access_denied");
  if (!path.isAbsolute(context.repositoryRoot) || context.repositoryRoot !== path.resolve(context.repositoryRoot) || context.snapshot.root !== context.repositoryRoot) return fail("snapshot_identity_mismatch");
  if (context.snapshot.fingerprint !== value.sourceSnapshotFingerprint) return fail("stale_snapshot");
  let report;
  try { report = analyzeMobileCompatibility(context.snapshot, { applicationRoot: value.applicationRoot as string }); }
  catch { return fail("invalid_snapshot"); }
  if (report.reportFingerprint !== value.compatibilityReportFingerprint) return fail("stale_compatibility");
  const application = report.applications.find(app => app.root === value.applicationRoot);
  const target = application?.targets.find(item => item.target === value.target);
  if (report.selection !== "selected" || report.selectedApplicationRoot !== value.applicationRoot || report.blockers.length ||
    !application || application.classification !== "candidate" || application.adapter !== "capacitor" || application.blockers.length ||
    !target || target.classification !== "candidate" || target.blockers.length) return fail("ineligible_application");
  const android = value.target === "android";
  // Android: at least two Java-style segments, each beginning with a letter.
  // iOS: explicit reverse-DNS bundle ID, alphanumeric/hyphen segments; no wildcard/underscore.
  if (!text(value.applicationIdentifier, 255) || !(android ? /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/ : /^[A-Za-z0-9]+(?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9]+(?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/).test(value.applicationIdentifier)) return fail("invalid_identifier");
  if (typeof value.version !== "string" || !/^(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})$/.test(value.version)) return fail("invalid_version");
  if (android ? !(typeof value.buildNumber === "number" && Number.isSafeInteger(value.buildNumber) && value.buildNumber >= 1 && value.buildNumber <= 2_100_000_000) :
    !(typeof value.buildNumber === "string" && /^[1-9][0-9]{0,3}(?:\.(?:0|[1-9][0-9]?)){0,2}$/.test(value.buildNumber))) return fail("invalid_build_number");
  const capabilities = array(value.nativeCapabilities, 3);
  if (capabilities.some(capability => !["network", "camera", "location"].includes(capability as string)) || new Set(capabilities).size !== capabilities.length) return fail("unsupported_capability");
  const permissionMap: Record<string, string[]> = android ? {
    network: ["android.permission.INTERNET"], camera: ["android.permission.CAMERA"],
    location: ["android.permission.ACCESS_COARSE_LOCATION"],
  } : { network: [], camera: ["NSCameraUsageDescription"], location: ["NSLocationWhenInUseUsageDescription"] };
  // Precise location is optional; never require more access than the feature requests.
  const allowed = [...Object.values(permissionMap).flat(), ...(android ? ["android.permission.ACCESS_FINE_LOCATION"] : [])];
  const permissions = array(value.permissions, 4).map(permission => {
    const declaration = record(permission, ["name", "rationale"]);
    if (typeof declaration.name !== "string" || !allowed.includes(declaration.name)) return fail("unsupported_permission");
    if (!text(declaration.rationale, 240) || declaration.rationale.length < 10) return fail("invalid_input");
    return { name: declaration.name, rationale: declaration.rationale.normalize("NFC") };
  }).sort((a, b) => compare(a.name, b.name));
  const required = capabilities.flatMap(capability => permissionMap[capability as string]).sort(compare);
  const declared = permissions.map(permission => permission.name);
  if (new Set(declared).size !== declared.length || required.some(name => !declared.includes(name)) ||
    declared.some(name => !required.includes(name) && !(android && capabilities.includes("location") && name === "android.permission.ACCESS_FINE_LOCATION"))) return fail("permission_capability_mismatch");
  const build = record(value.build, ["mode", "webAssetsDirectory"]);
  const artifact = record(value.artifact, ["format", "signing"]);
  if (!["debug", "release"].includes(build.mode as string) || !relative(build.webAssetsDirectory) ||
    !["unsigned", "required"].includes(artifact.signing as string) ||
    !(android ? ["apk", "aab"] : ["ipa", "simulator-app"]).includes(artifact.format as string) ||
    (artifact.format === "aab" && build.mode !== "release") ||
    ((artifact.format === "ipa" || artifact.format === "aab" || (android && build.mode === "release")) && artifact.signing !== "required") ||
    (artifact.format === "simulator-app" && artifact.signing !== "unsigned")) return fail("invalid_build_configuration");
  const specification: Omit<MobilePackageSpecification, "specificationFingerprint"> = {
    schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId: context.projectId, applicationRoot: application.root,
    target: value.target as "android" | "ios", applicationName: (value.applicationName as string).normalize("NFC"),
    applicationIdentifier: value.applicationIdentifier as string, version: value.version as string, buildNumber: value.buildNumber as string | number,
    sourceSnapshotFingerprint: report.snapshotFingerprint, compatibilityReportFingerprint: report.reportFingerprint,
    nativeCapabilities: [...(capabilities as MobileNativeCapability[])].sort(compare), permissions,
    build: { mode: build.mode as "debug" | "release", webAssetsDirectory: build.webAssetsDirectory as string },
    artifact: { format: artifact.format as MobilePackageSpecificationInput["artifact"]["format"], signing: artifact.signing as "unsigned" | "required" },
    adapter: "capacitor", framework: application.framework, compatibilityVersion: report.version, buildVerification: "not-performed",
  };
  const specificationFingerprint = createHash("sha256").update(canonical(specification)).digest("hex");
  return freeze({ ...specification, specificationFingerprint });
}
