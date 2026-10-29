import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import type { RepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
import { analyzeMobileCompatibility } from "../analyzeMobileCompatibility.js";
import { MOBILE_PACKAGE_SPECIFICATION_VERSION, type MobilePackageValidationContext } from "../MobilePackageSpecification.js";
import { validateMobilePackageSpecification } from "../validateMobilePackageSpecification.js";
import { MobileBuildLifecycle } from "../MobileBuildLifecycle.js";
import { MobileBuildContractError, classifyMobileBuildFailure, createMobileBuildRequest, freezeMobileBuildValue,
  type MobileArtifactEvidence, type MobileBuildCommand, type MobileBuildRecord, type MobileArtifactVerifier } from "../MobileBuildRequest.js";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
function fixture(platform: "android" | "ios" = "android") {
  const contents: Record<string, string> = { "package.json": JSON.stringify({ dependencies: { react: "18", vite: "5" }, scripts: { build: "vite build" } }), "index.html": "<head></head>", "src/main.tsx": "DoNotExecute();" };
  const files = Object.keys(contents).sort().map(path => ({ path, bytes: Buffer.byteLength(contents[path]), sha256: hash(contents[path]), text: true, ignored: false, tracked: null }));
  const snapshot: RepositorySnapshot = { root: "/runtime/projects/shop", files, fingerprint: hash(files.map(f => `${f.path}\0${f.sha256}`).join("\n")), commit: "a".repeat(40), skippedDirectories: [], read: file => contents[file], readSensitive: () => { throw new Error("forbidden"); } };
  const context: MobilePackageValidationContext = { projectId: "shop", repositoryRoot: snapshot.root, snapshot, metadata: { projectId: "shop", ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 }, identity: { source: "verified-token", caller: { userId: "alice", role: "pro", supportAccess: false, adminTools: false } } };
  const compatibility = analyzeMobileCompatibility(snapshot, { applicationRoot: "." });
  const specification = validateMobilePackageSpecification({ schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId: "shop", applicationRoot: ".", target: platform, applicationName: "Shop", applicationIdentifier: "com.example.shop", version: "1.0.0", buildNumber: platform === "android" ? 1 : "1", sourceSnapshotFingerprint: snapshot.fingerprint, compatibilityReportFingerprint: compatibility.reportFingerprint, nativeCapabilities: [], permissions: [], build: { mode: "release", webAssetsDirectory: "dist" }, artifact: { format: platform === "android" ? "aab" : "ipa", signing: "required" } }, context);
  const input = { projectId: "shop", specificationFingerprint: specification.specificationFingerprint, operation: "package", idempotencyKey: "request-1", maxAttempts: 3 };
  return { specification, input, context };
}
function rejected(run: () => unknown, code: string) { assert.throws(run, e => e instanceof MobileBuildContractError && e.code === code); }
const current = (record: MobileBuildRecord) => record.attempts[record.attempts.length - 1];
function command(record: MobileBuildRecord, action: Record<string, unknown>): MobileBuildCommand {
  return { expectedSequence: record.sequence, attemptId: current(record).attemptId, ...action } as MobileBuildCommand;
}
// Synthetic contract fixture only. No production verifier exists and no artifact/build is fabricated by the implementation.
const verifiedFixture: MobileArtifactVerifier = (reference, expected) => ({ reference, requestId: expected.request.requestId, attemptId: expected.attemptId,
  projectId: expected.request.projectId, target: expected.request.target, format: expected.specification.artifact.format,
  applicationIdentifier: expected.specification.applicationIdentifier, version: expected.specification.version, buildNumber: expected.specification.buildNumber,
  sourceSnapshotFingerprint: expected.request.sourceSnapshotFingerprint, specificationFingerprint: expected.specification.specificationFingerprint,
  sha256: "b".repeat(64), bytes: 1234, verification: "verified", signing: "verified" });
for (const platform of ["android", "ios"] as const) test(`constructs immutable deterministic ${platform} request bound to accepted specification`, () => {
  const { specification, input, context } = fixture(platform); const request = createMobileBuildRequest(input, specification, context);
  assert.deepEqual(request, createMobileBuildRequest(Object.fromEntries(Object.entries(input).reverse()), specification, context));
  assert.equal(request.target, platform); assert.equal(request.profile, "release"); assert.equal(request.sourceCommit, "a".repeat(40));
  assert.equal(request.specificationFingerprint, specification.specificationFingerprint); assert.equal(request.applicationIdentifier, specification.applicationIdentifier);
  assert.match(request.requestFingerprint, /^[a-f0-9]{64}$/); assert.ok(Object.isFrozen(request));
});
test("rejects mismatched, mutable, tampered and stale specifications", () => {
  const { specification, input, context } = fixture();
  rejected(() => createMobileBuildRequest({ ...input, specificationFingerprint: "c".repeat(64) }, specification, context), "invalid_specification");
  rejected(() => createMobileBuildRequest(input, { ...specification }, context), "invalid_specification");
  rejected(() => createMobileBuildRequest(input, freezeMobileBuildValue({ ...specification, buildNumber: 9 }), context), "invalid_specification");
  rejected(() => createMobileBuildRequest(input, specification, { ...context, snapshot: { ...context.snapshot, fingerprint: "c".repeat(64) } }), "invalid_specification");
});
test("cross-project identity and unauthorized callers cannot create or update requests", () => {
  const { specification, input, context } = fixture();
  rejected(() => createMobileBuildRequest({ ...input, projectId: "theirs" }, specification, context), "project_mismatch");
  const denied = { ...context, identity: { ...context.identity, caller: { ...context.identity.caller, userId: "mallory" } } };
  rejected(() => createMobileBuildRequest(input, specification, denied), "access_denied");
  const authority = new MobileBuildLifecycle(); const record = authority.create(input, specification, context);
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "start" }), denied), "access_denied");
  rejected(() => authority.get(record.request.requestId, denied), "access_denied");
  const other = { ...context, projectId: "theirs", metadata: { ...context.metadata!, projectId: "theirs" } };
  rejected(() => authority.get(record.request.requestId, other), "request_not_found");
});
for (const source of ["anonymous", "development-identity", "local-headers", "rejected-token"] as const) test(`rejects ${source} authority`, () => {
  const { specification, input, context } = fixture();
  rejected(() => createMobileBuildRequest(input, specification, { ...context, identity: { ...context.identity, source } }), "access_denied");
});
for (const invalid of [0, 4, 1.5, "3", null]) test(`rejects maxAttempts ${invalid}`, () => {
  const { specification, input, context } = fixture(); rejected(() => createMobileBuildRequest({ ...input, maxAttempts: invalid }, specification, context), "invalid_request");
});
for (const patch of [{ operation: "sign" }, { operation: "distribute" }, { idempotencyKey: "" }, { idempotencyKey: "../escape" }, { authorized: true }, { actorId: "staff" }]) test(`rejects malformed request ${JSON.stringify(patch)}`, () => {
  const { specification, input, context } = fixture(); rejected(() => createMobileBuildRequest({ ...input, ...patch }, specification, context), "invalid_request");
});
test("same idempotency key returns current state; conflicting payload is rejected", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle();
  const first = authority.create(input, specification, context); assert.equal(authority.create(input, specification, context), first);
  const running = authority.transition(first.request.requestId, command(first, { type: "start" }), context);
  assert.equal(authority.create(input, specification, context), running);
  rejected(() => authority.create({ ...input, maxAttempts: 2 }, specification, context), "idempotency_conflict");
  assert.notEqual(authority.create({ ...input, idempotencyKey: "request-2" }, specification, context).request.requestId, first.request.requestId);
});
test("idempotency is scoped to the authorized actor", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); const first = authority.create(input, specification, context);
  const staff = { ...context, identity: { ...context.identity, caller: { userId: "staff", role: "admin" as const, supportAccess: true, adminTools: true } } };
  assert.notEqual(authority.create(input, specification, staff).request.requestId, first.request.requestId);
});
test("explicit queued/running/verifying/completed transitions preserve source and spec provenance", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(verifiedFixture);
  let record = authority.create(input, specification, context); const original = record;
  for (const type of ["start", "verify", "complete"]) record = authority.transition(record.request.requestId, command(record, { type, ...(type === "complete" ? { artifactReference: "artifact:one" } : {}) }), context);
  assert.equal(current(record).state, "completed"); assert.equal(record.sequence, 3); assert.equal(current(original).state, "queued");
  assert.equal(record.request, original.request); assert.equal(current(record).artifact!.sourceSnapshotFingerprint, specification.sourceSnapshotFingerprint);
  assert.equal(record.distributionVerification, "not-performed"); assert.ok(Object.isFrozen(current(record).artifact));
  assert.throws(() => { (record.attempts as unknown[]).push({}); }, TypeError);
});
test("stale sequence, old attempt and out-of-order transitions fail without state change", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); const first = authority.create(input, specification, context);
  rejected(() => authority.transition(first.request.requestId, command(first, { type: "verify" }), context), "invalid_transition");
  const running = authority.transition(first.request.requestId, command(first, { type: "start" }), context);
  rejected(() => authority.transition(first.request.requestId, command(first, { type: "start" }), context), "stale_transition");
  rejected(() => authority.transition(first.request.requestId, { ...command(running, { type: "verify" }), attemptId: "wrong" }, context), "stale_transition");
  rejected(() => authority.transition(first.request.requestId, command(running, { type: "start" }), context), "invalid_transition");
  assert.equal(authority.get(first.request.requestId, context), running);
});
test("completion fails closed by default; exit code and client verification flags are not evidence", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); let record = authority.create(input, specification, context);
  for (const type of ["start", "verify"]) record = authority.transition(record.request.requestId, command(record, { type }), context);
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), context), "artifact_not_verified");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one", exitCode: 0, verified: true }), context), "invalid_request");
  assert.equal(current(authority.get(record.request.requestId, context)).state, "verifying");
});
for (const field of ["reference", "requestId", "attemptId", "projectId", "target", "format", "applicationIdentifier", "version", "buildNumber", "sourceSnapshotFingerprint", "specificationFingerprint", "sha256", "bytes", "verification", "signing"]) test(`artifact ${field} mismatch prevents completion`, () => {
  const { specification, input, context } = fixture();
  const authority = new MobileBuildLifecycle((ref, expected) => ({ ...verifiedFixture(ref, expected), [field]: field === "bytes" ? 0 : "wrong" }) as MobileArtifactEvidence);
  let record = authority.create(input, specification, context); for (const type of ["start", "verify"]) record = authority.transition(record.request.requestId, command(record, { type }), context);
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), context), "artifact_not_verified");
});
test("verifier failures cannot become completion", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(() => { throw new Error("secret"); }); let record = authority.create(input, specification, context);
  for (const type of ["start", "verify"]) record = authority.transition(record.request.requestId, command(record, { type }), context);
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), context), "artifact_not_verified");
});
test("queued cancellation is terminal; active cancellation requires acknowledgment and blocks completion", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(verifiedFixture); let record = authority.create(input, specification, context);
  record = authority.transition(record.request.requestId, command(record, { type: "cancel" }), context); assert.equal(current(record).state, "cancelled");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "start" }), context), "invalid_transition");
  record = authority.retry(record.request.requestId, record.sequence, context); record = authority.transition(record.request.requestId, command(record, { type: "start" }), context);
  record = authority.transition(record.request.requestId, command(record, { type: "cancel" }), context); assert.equal(current(record).state, "cancelling");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), context), "invalid_transition");
  record = authority.transition(record.request.requestId, command(record, { type: "cancelled" }), context); assert.equal(current(record).state, "cancelled");
});
test("bounded retries create new attempts while retaining terminal history", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); let record = authority.create({ ...input, maxAttempts: 2 }, specification, context);
  const firstId = current(record).attemptId;
  record = authority.transition(record.request.requestId, command(record, { type: "fail", reason: "timeout" }), context);
  const terminal = record; record = authority.retry(record.request.requestId, record.sequence, context);
  assert.notEqual(current(record).attemptId, firstId); assert.equal(record.attempts[0], current(terminal)); assert.equal(current(record).number, 2);
  rejected(() => authority.transition(record.request.requestId, command(terminal, { type: "start" }), context), "stale_transition");
  record = authority.transition(record.request.requestId, command(record, { type: "fail", reason: "timeout" }), context);
  rejected(() => authority.retry(record.request.requestId, record.sequence, context), "retry_denied");
});
test("retry requires fresh authorization, current sequence and unchanged source evidence", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); let record = authority.create(input, specification, context);
  record = authority.transition(record.request.requestId, command(record, { type: "fail", reason: "executor_unavailable" }), context);
  rejected(() => authority.retry(record.request.requestId, record.sequence - 1, context), "stale_transition");
  rejected(() => authority.retry(record.request.requestId, record.sequence, { ...context, identity: { ...context.identity, source: "anonymous" } }), "access_denied");
  rejected(() => authority.retry(record.request.requestId, record.sequence, { ...context, snapshot: { ...context.snapshot, fingerprint: "c".repeat(64) } }), "invalid_specification");
});
for (const reason of ["dependency_failure", "build_failure", "artifact_verification_failed", "internal_failure"] as const) test(`${reason} is deterministic and not automatically retryable`, () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); let record = authority.create(input, specification, context);
  record = authority.transition(record.request.requestId, command(record, { type: "fail", reason }), context);
  assert.deepEqual(current(record).failure, { classification: reason, retryable: false });
  rejected(() => authority.retry(record.request.requestId, record.sequence, context), "retry_denied");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "cancel" }), context), "invalid_transition");
});
test("completed records cannot be retried or rewritten", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(verifiedFixture); let record = authority.create(input, specification, context);
  for (const type of ["start", "verify", "complete"]) record = authority.transition(record.request.requestId, command(record, { type, ...(type === "complete" ? { artifactReference: "artifact:one" } : {}) }), context);
  rejected(() => authority.retry(record.request.requestId, record.sequence, context), "retry_denied");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "fail", reason: "timeout" }), context), "invalid_transition");
});
test("bounded diagnostic references contain no log payload and cannot repeat", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); let record = authority.create(input, specification, context);
  record = authority.transition(record.request.requestId, command(record, { type: "diagnostic", reference: "log:one" }), context);
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "diagnostic", reference: "log:one" }), context), "invalid_request");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "diagnostic", reference: "https://secret" }), context), "invalid_request");
  for (let i = 1; i < 100; i++) record = authority.transition(record.request.requestId, command(record, { type: "diagnostic", reference: `log:${i}` }), context);
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "diagnostic", reference: "log:overflow" }), context), "invalid_request");
});
test("unknown failures classify conservatively without leaking raw exception text", () => {
  assert.deepEqual(classifyMobileBuildFailure(new Error("secret")), { classification: "internal_failure", retryable: false });
  for (const reason of ["executor_unavailable", "timeout", "source_unavailable"]) assert.equal(classifyMobileBuildFailure(reason).retryable, true);
});


test("starting requires the original source and commit; cancellation remains possible after source changes", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); let record = authority.create(input, specification, context);
  const changed = { ...context, snapshot: { ...context.snapshot, fingerprint: "c".repeat(64) } };
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "start" }), changed), "invalid_specification");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "start" }), { ...context, snapshot: { ...context.snapshot, commit: "c".repeat(40) } }), "invalid_specification");
  record = authority.transition(record.request.requestId, command(record, { type: "cancel" }), changed);
  assert.equal(current(record).state, "cancelled");
});
test("verifier reentry cannot overwrite an accepted cancellation", () => {
  const { specification, input, context } = fixture(); let record: MobileBuildRecord;
  const authority = new MobileBuildLifecycle((ref, expected) => {
    record = authority.transition(record.request.requestId, command(record, { type: "cancel" }), context);
    return verifiedFixture(ref, expected);
  });
  record = authority.create(input, specification, context);
  for (const type of ["start", "verify"]) record = authority.transition(record.request.requestId, command(record, { type }), context);
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), context), "stale_transition");
  assert.equal(current(authority.get(record.request.requestId, context)).state, "cancelling");
});
test("executable accessors, unknown transitions and raw failure text are rejected", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); const record = authority.create(input, specification, context);
  const accessor = command(record, { type: "start" }); Object.defineProperty(accessor, "type", { get: () => { throw new Error("must never execute"); } });
  rejected(() => authority.transition(record.request.requestId, accessor, context), "invalid_request");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "unknown" }), context), "invalid_request");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "fail", reason: "secret raw exception" }), context), "invalid_request");
});
test("view-only teammates cannot authorize request creation or lifecycle changes", () => {
  const { specification, input, context } = fixture(); const authority = new MobileBuildLifecycle(); const record = authority.create(input, specification, context);
  const teammate: MobilePackageValidationContext = { ...context, metadata: { ...context.metadata!, teamId: "team" }, identity: { source: "internal-token", caller: { userId: "bob", teamId: "team", role: "pro", supportAccess: false, adminTools: false } } };
  assert.equal(authority.get(record.request.requestId, teammate), record);
  rejected(() => authority.create(input, specification, teammate), "access_denied");
  rejected(() => authority.transition(record.request.requestId, command(record, { type: "start" }), teammate), "access_denied");
});
