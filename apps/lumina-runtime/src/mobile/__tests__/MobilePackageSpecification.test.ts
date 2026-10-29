import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import type { RepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
import { analyzeMobileCompatibility } from "../analyzeMobileCompatibility.js";
import { MOBILE_PACKAGE_SPECIFICATION_VERSION, MobilePackageValidationError, type MobilePackageValidationContext } from "../MobilePackageSpecification.js";
import { validateMobilePackageSpecification as validate } from "../validateMobilePackageSpecification.js";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
function snapshot(contents: Record<string, string>): RepositorySnapshot {
  const files = Object.keys(contents).sort().map(path => ({ path, bytes: Buffer.byteLength(contents[path]), sha256: sha(contents[path]), text: true, ignored: false, tracked: null }));
  return { root: "/runtime/projects/shop", files, fingerprint: sha(files.map(f => `${f.path}\0${f.sha256}`).join("\n")), commit: null, skippedDirectories: [], read: file => contents[file] ?? null, readSensitive: () => { throw new Error("forbidden"); } };
}
const web = { "package.json": JSON.stringify({ dependencies: { react: "18", vite: "5" }, scripts: { build: "vite build" } }), "index.html": "<head></head>", "src/main.tsx": "neverExecute();" };
function fixture(target: "android" | "ios" = "android", contents: Record<string, string> = web, applicationRoot = ".") {
  const source = snapshot(contents);
  const report = analyzeMobileCompatibility(source, { applicationRoot });
  const context: MobilePackageValidationContext = { identity: { source: "verified-token", caller: { userId: "alice", role: "pro", supportAccess: false, adminTools: false } }, projectId: "shop", repositoryRoot: source.root,
    metadata: { projectId: "shop", ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 }, snapshot: source };
  const input = { schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId: "shop", applicationRoot, target, applicationName: "My Application", applicationIdentifier: target === "android" ? "com.example.my_app" : "com.example.my-app", version: "1.2.3", buildNumber: target === "android" ? 42 : "42.1.0", sourceSnapshotFingerprint: source.fingerprint, compatibilityReportFingerprint: report.reportFingerprint,
    nativeCapabilities: ["camera", "network"], permissions: target === "android" ? [{ name: "android.permission.CAMERA", rationale: "Take a photo requested by the user." }, { name: "android.permission.INTERNET", rationale: "Connect to the configured application API." }] : [{ name: "NSCameraUsageDescription", rationale: "Take a photo requested by the user." }],
    build: { mode: "debug", webAssetsDirectory: "dist" }, artifact: { format: target === "android" ? "apk" : "simulator-app", signing: "unsigned" } };
  return { input, context };
}
function rejects(input: unknown, context: MobilePackageValidationContext, code?: string) {
  assert.throws(() => validate(input, context), error => error instanceof MobilePackageValidationError && (!code || error.code === code));
}
for (const platform of ["android", "ios"] as const) test(`valid ${platform} specification is immutable evidence, not build certification`, () => {
  const { input, context } = fixture(platform); const spec = validate(input, context);
  assert.equal(spec.projectId, "shop"); assert.equal(spec.target, platform); assert.equal(spec.adapter, "capacitor"); assert.equal(spec.buildVerification, "not-performed");
  assert.match(spec.specificationFingerprint, /^[a-f0-9]{64}$/); assert.equal(Object.isFrozen(input), false);
});
for (const [platform, identifiers] of [["android", ["app", "com.1app", "com.my-app", "com.*", ".com.app", "com..app", "com.app/escape", "com.app "]], ["ios", ["app", "com.my_app", "com.*", "com..app", "com.-app", "com.app-", "com.app/escape", "com.app "]]] as const) {
  for (const identifier of identifiers) test(`${platform} rejects identifier ${identifier}`, () => { const { input, context } = fixture(platform); rejects({ ...input, applicationIdentifier: identifier }, context, "invalid_identifier"); });
}
for (const version of ["1", "1.0", "01.2.3", "1.2.3-beta", "1.2.3+4", "1.2.-1", "1.2.3.4", "10000.1.1", 123, null]) test(`rejects version ${version}`, () => {
  const { input, context } = fixture(); rejects({ ...input, version }, context, "invalid_version");
});
for (const [platform, numbers] of [["android", [0, -1, 1.1, 2_100_000_001, "42", NaN, Infinity]], ["ios", [0, 42, "0", "01", "1.100", "10000", "1.2.3.4", "1.2b4"]]] as const) {
  for (const number of numbers) test(`${platform} rejects build number ${number}`, () => { const { input, context } = fixture(platform); rejects({ ...input, buildNumber: number }, context, "invalid_build_number"); });
}
test("accepts bounded platform build numbers and future signed artifact requirements without credentials", () => {
  for (const [target, buildNumber, format] of [["android", 2_100_000_000, "aab"], ["ios", "9999.99.99", "ipa"]] as const) {
    const { input, context } = fixture(target); const spec = validate({ ...input, buildNumber, build: { ...input.build, mode: "release" }, artifact: { format, signing: "required" } }, context);
    assert.equal(spec.artifact.signing, "required"); assert.equal(spec.buildVerification, "not-performed");
  }
});
test("unsupported, duplicate, cross-platform and undeclared permissions fail closed", () => {
  const { input, context } = fixture();
  rejects({ ...input, permissions: [{ name: "android.permission.READ_SMS", rationale: "Not an approved capability." }] }, context, "unsupported_permission");
  rejects({ ...input, nativeCapabilities: ["push"] }, context, "unsupported_capability");
  rejects({ ...input, nativeCapabilities: ["camera", "camera"] }, context, "unsupported_capability");
  rejects({ ...input, permissions: [input.permissions[0], input.permissions[0]] }, context, "permission_capability_mismatch");
  rejects({ ...input, permissions: [] }, context, "permission_capability_mismatch");
  rejects({ ...input, nativeCapabilities: [], permissions: input.permissions }, context, "permission_capability_mismatch");
  rejects({ ...input, permissions: [{ ...input.permissions[0], rationale: " " }] }, context, "invalid_input");
  const ios = fixture("ios"); rejects({ ...ios.input, permissions: input.permissions }, ios.context, "unsupported_permission");
});
test("location requires its complete reviewed platform declarations", () => {
  for (const target of ["android", "ios"] as const) {
    const { input, context } = fixture(target);
    const names = target === "android" ? ["android.permission.ACCESS_COARSE_LOCATION", "android.permission.ACCESS_FINE_LOCATION"] : ["NSLocationWhenInUseUsageDescription"];
    validate({ ...input, nativeCapabilities: ["location"], permissions: names.map(name => ({ name, rationale: "Locate the user only upon request." })) }, context);
  }
});
test("source and compatibility digests must match recomputed Runtime evidence", () => {
  const { input, context } = fixture();
  rejects({ ...input, sourceSnapshotFingerprint: "0".repeat(64) }, context, "stale_snapshot");
  rejects({ ...input, compatibilityReportFingerprint: "0".repeat(64) }, context, "stale_compatibility");
  const newer = snapshot({ ...web, "README.md": "new source" });
  rejects(input, { ...context, snapshot: newer }, "stale_snapshot");
  rejects({ ...input, sourceSnapshotFingerprint: newer.fingerprint }, { ...context, snapshot: newer }, "stale_compatibility");
  rejects(input, { ...context, snapshot: { ...context.snapshot, read: () => "tampered" } }, "invalid_snapshot");
});
test("cross-project identity and repository roots cannot be substituted", () => {
  const { input, context } = fixture();
  rejects({ ...input, projectId: "theirs" }, context, "project_identity_mismatch");
  rejects(input, { ...context, metadata: { ...context.metadata!, projectId: "theirs" } }, "project_identity_mismatch");
  rejects(input, { ...context, repositoryRoot: "/runtime/projects/theirs" }, "snapshot_identity_mismatch");
  rejects(input, { ...context, metadata: null }, "project_identity_mismatch");
  rejects(input, { ...context, identity: { ...context.identity, caller: { ...context.identity.caller, userId: "mallory" } } }, "project_access_denied");
});
for (const source of ["anonymous", "local-headers", "development-identity", "rejected-token"] as const) test(`${source} is not authoritative`, () => {
  const { input, context } = fixture(); rejects(input, { ...context, identity: { ...context.identity, source } }, "authentication_required");
});
test("trusted internal identities reuse existing view policy; validation grants no permissions", () => {
  const { input, context } = fixture(); validate(input, { ...context, identity: { ...context.identity, source: "internal-token" } });
  rejects(input, { ...context, identity: { source: "internal-token", caller: { ...context.identity.caller, userId: "mallory" } } }, "project_access_denied");
});
test("client authorization, reports, signing secrets and unknown fields are rejected", () => {
  const { input, context } = fixture();
  for (const key of ["authorized", "identity", "caller", "role", "report", "specificationFingerprint", "signingCredentials"]) rejects({ ...input, [key]: true }, context, "invalid_input");
  rejects({ ...input, artifact: { ...input.artifact, key: "secret" } }, context, "invalid_input");
});
test("ambiguous, missing and unsafe roots cannot produce a specification", () => {
  const contents = Object.fromEntries(["apps/a", "apps/b"].flatMap(root => Object.entries(web).map(([file, value]) => [`${root}/${file}`, value])));
  const { input, context } = fixture("android", contents, "apps/a");
  validate(input, context);
  const ambiguous = analyzeMobileCompatibility(context.snapshot);
  rejects({ ...input, applicationRoot: ".", compatibilityReportFingerprint: ambiguous.reportFingerprint }, context);
  for (const applicationRoot of ["", "../app", "/app", "a\\b", "a//b"]) rejects({ ...input, applicationRoot }, context, "invalid_input");
  const missing = analyzeMobileCompatibility(context.snapshot, { applicationRoot: "missing" });
  rejects({ ...input, applicationRoot: "missing", compatibilityReportFingerprint: missing.reportFingerprint }, context, "ineligible_application");
});
for (const [name, contents] of [
  ["unknown", { "README.md": "unknown" }], ["backend", { "package.json": JSON.stringify({ dependencies: { express: "4" } }) }],
  ["SSR", { ...web, "package.json": JSON.stringify({ dependencies: { next: "15" } }) }],
  ["native", { "app/src/main/AndroidManifest.xml": "<manifest/>", "build.gradle": "plugins {}" }],
  ["unresolved blocker", { ...web, "index.html": "<body/>" }],
] as [string, Record<string, string>][]) test(`${name} cannot become eligible through client claims`, () => {
  const { input, context } = fixture("android", contents); rejects(input, context, "ineligible_application");
});
test("canonical hashing ignores object key order and declaration set ordering", () => {
  const { input, context } = fixture(); const first = validate(input, context);
  const reversed = Object.fromEntries(Object.entries(input).reverse());
  assert.deepEqual(first, validate({ ...reversed, nativeCapabilities: [...input.nativeCapabilities].reverse(), permissions: [...input.permissions].reverse(), build: Object.fromEntries(Object.entries(input.build).reverse()) }, context));
  assert.notEqual(first.specificationFingerprint, validate({ ...input, applicationName: "Another App" }, context).specificationFingerprint);
  assert.notEqual(first.specificationFingerprint, validate({ ...input, buildNumber: 43 }, context).specificationFingerprint);
  assert.equal(first.specificationFingerprint, validate(JSON.parse(JSON.stringify(input)), context).specificationFingerprint);
});
test("accepted specification is detached and recursively frozen", () => {
  const { input, context } = fixture(); const spec = validate(input, context); const serialized = JSON.stringify(spec);
  for (const value of [spec, spec.build, spec.artifact, spec.permissions, spec.permissions[0], spec.nativeCapabilities]) assert.equal(Object.isFrozen(value), true);
  assert.throws(() => { (spec as { applicationName: string }).applicationName = "changed"; }, TypeError);
  assert.throws(() => { (spec.permissions as unknown[]).push({}); }, TypeError);
  assert.throws(() => { (spec.permissions[0] as { rationale: string }).rationale = "changed"; }, TypeError);
  input.build.mode = "release"; input.permissions[0].rationale = "mutated original"; input.nativeCapabilities.push("location");
  assert.equal(JSON.stringify(spec), serialized);
});
test("build and artifact plans reject incompatible targets, unsafe paths and hidden commands", () => {
  const { input, context } = fixture();
  for (const webAssetsDirectory of ["/tmp", "../dist", "dist/../out", "dist\\out", ".", "dist%2Fout"]) rejects({ ...input, build: { ...input.build, webAssetsDirectory } }, context, "invalid_build_configuration");
  rejects({ ...input, build: { ...input.build, command: "npm run build" } }, context, "invalid_input");
  rejects({ ...input, artifact: { format: "ipa", signing: "required" } }, context, "invalid_build_configuration");
  rejects({ ...input, artifact: { format: "aab", signing: "unsigned" } }, context, "invalid_build_configuration");
  rejects({ ...input, build: { ...input.build, mode: "release" } }, context, "invalid_build_configuration");
  const ios = fixture("ios"); rejects({ ...ios.input, artifact: { format: "ipa", signing: "unsigned" } }, ios.context, "invalid_build_configuration");
});
test("malformed, incomplete, accessor and ambiguous data is rejected without evaluating getters", () => {
  const { input, context } = fixture();
  for (const value of [null, [], {}, { ...input, schemaVersion: "v999" }, { ...input, permissions: null }, { ...input, nativeCapabilities: ["camera", "network", "location", "other"] }]) rejects(value, context, "invalid_input");
  const getter = { ...input }; Object.defineProperty(getter, "version", { get: () => { throw new Error("must not execute"); } }); rejects(getter, context, "invalid_input");
});


test("approximate Android location does not require precise access", () => {
  const { input, context } = fixture();
  validate({ ...input, nativeCapabilities: ["location"], permissions: [{ name: "android.permission.ACCESS_COARSE_LOCATION", rationale: "Locate approximately upon user request." }] }, context);
  rejects({ ...input, nativeCapabilities: ["location"], permissions: [{ name: "android.permission.ACCESS_FINE_LOCATION", rationale: "Locate precisely upon user request." }] }, context, "permission_capability_mismatch");
});
test("sparse and accessor arrays are rejected as malformed data", () => {
  const { input, context } = fixture();
  const sparse = new Array(1); Object.assign(sparse, { extra: "camera" });
  rejects({ ...input, nativeCapabilities: sparse }, context, "invalid_input");
  const accessor = ["camera"]; Object.defineProperty(accessor, "0", { get: () => { throw new Error("must not execute"); } });
  rejects({ ...input, nativeCapabilities: accessor }, context, "invalid_input");
});
