import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import test from "node:test";
import { RuntimeMobileBuilds, RuntimeMobileBuildUnavailable } from "../RuntimeMobileBuilds.js";
import { MOBILE_WORKER_LEASE_POLICY, MobileWorkerLeaseError } from "../MobileWorkerLease.js";
import { MobileBuildLifecycle } from "../MobileBuildLifecycle.js";
import { FileMobileBuildStore, MobileBuildPersistenceError } from "../MobileBuildStore.js";
import { MobileBuildContractError, type MobileArtifactVerifier, type MobileBuildCommand, type MobileBuildRecord } from "../MobileBuildRequest.js";
import { MOBILE_PACKAGE_SPECIFICATION_VERSION, type MobilePackageValidationContext } from "../MobilePackageSpecification.js";
import { validateMobilePackageSpecification } from "../validateMobilePackageSpecification.js";
import { analyzeMobileCompatibility } from "../analyzeMobileCompatibility.js";
import type { RepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
async function fixture(run: (f: ReturnType<typeof setup>) => void | Promise<void>) {
  const f = setup(); try { await run(f); } finally { f.services.reverse().forEach(service => service.close()); fs.rmSync(f.temporary, { recursive: true, force: true }); assert.equal(fs.existsSync(f.temporary), false); }
}
function setup() {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "klm-orchestration-")); const root = path.join(temporary, "store"); fs.mkdirSync(root, { mode: 0o700 });
  const environment = { NODE_ENV: "production", KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: root, KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "exclusive-local" };
  const contents: Record<string, string> = { "package.json": JSON.stringify({ dependencies: { react: "18", vite: "5" }, scripts: { build: "vite build" } }), "index.html": "<head></head>", "src/main.tsx": "NeverExecute();" };
  const files = Object.keys(contents).sort().map(path => ({ path, bytes: Buffer.byteLength(contents[path]), sha256: hash(contents[path]), text: true, ignored: false, tracked: null }));
  const snapshot: RepositorySnapshot = { root: "/runtime/projects/shop", files, fingerprint: hash(files.map(f => `${f.path}\0${f.sha256}`).join("\n")), commit: "a".repeat(40), skippedDirectories: [], read: file => contents[file], readSensitive: () => { throw new Error("forbidden"); } };
  const context: MobilePackageValidationContext = { projectId: "shop", repositoryRoot: snapshot.root, snapshot, metadata: { projectId: "shop", ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 }, identity: { source: "verified-token", caller: { userId: "alice", role: "pro", supportAccess: false, adminTools: false } } };
  const report = analyzeMobileCompatibility(snapshot, { applicationRoot: "." });
  const specification = validateMobilePackageSpecification({ schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId: "shop", applicationRoot: ".", target: "android", applicationName: "Shop", applicationIdentifier: "com.example.shop", version: "1.0.0", buildNumber: 1, sourceSnapshotFingerprint: snapshot.fingerprint, compatibilityReportFingerprint: report.reportFingerprint, nativeCapabilities: [], permissions: [], build: { mode: "debug", webAssetsDirectory: "dist" }, artifact: { format: "apk", signing: "unsigned" } }, context);
  const input = { projectId: "shop", specificationFingerprint: specification.specificationFingerprint, operation: "package", idempotencyKey: "one", maxAttempts: 3 };
  const clock = { now: 1_000_000 }; const services: RuntimeMobileBuilds[] = [];
  const open = (verifyArtifact?: MobileArtifactVerifier) => { const initialized = RuntimeMobileBuilds.initialize({ environment, verifyArtifact, now: () => clock.now }); assert.equal(initialized.ready, true); if (!initialized.ready) throw new Error("not ready"); services.push(initialized.service); return initialized.service; };
  const service = open(); const record = service.create(input, specification, context);
  return { temporary, root, environment, contents, context, specification, input, clock, services, open, service, record };
}
const last = (record: MobileBuildRecord) => record.attempts[record.attempts.length - 1];
const proof = (record: MobileBuildRecord) => ({ workerId: last(record).workerLease!.workerId, fencingToken: last(record).workerLease!.fencingToken });
const command = (record: MobileBuildRecord, extra: Record<string, unknown>) => ({ expectedSequence: record.sequence, attemptId: last(record).attemptId, ...extra }) as MobileBuildCommand;
const claim = (f: ReturnType<typeof setup>, record = f.record, workerId = "worker-one", ttl?: number) => f.service.claim(record.request.requestId, record.sequence, last(record).attemptId, workerId, f.context, ttl);
const reject = (work: () => unknown, code: string) => assert.throws(work, error => (error instanceof MobileWorkerLeaseError || error instanceof MobileBuildContractError || error instanceof RuntimeMobileBuildUnavailable || error instanceof MobileBuildPersistenceError) && error.code === code);
// Contract fixture only: there is no native executor or production verifier in this milestone.
const artifactFixture: MobileArtifactVerifier = (reference, expected) => ({ reference, requestId: expected.request.requestId, attemptId: expected.attemptId, projectId: expected.request.projectId, target: expected.request.target, format: expected.specification.artifact.format, applicationIdentifier: expected.specification.applicationIdentifier, version: expected.specification.version, buildNumber: expected.specification.buildNumber, sourceSnapshotFingerprint: expected.request.sourceSnapshotFingerprint, specificationFingerprint: expected.specification.specificationFingerprint, sha256: "b".repeat(64), bytes: 1000, verification: "verified", signing: "unsigned" });

test("valid eligibility atomically claims and starts one immutable attempt", async () => fixture(f => {
  const record = claim(f); assert.equal(last(record).state, "running"); assert.equal(record.sequence, 1);
  assert.equal(last(record).workerLease!.fencingToken, record.sequence); assert.equal(last(record).workerLease!.expiresAt, f.clock.now + 60_000);
  assert.ok(Object.isFrozen(last(record).workerLease)); assert.equal(record.request.specificationFingerprint, f.specification.specificationFingerprint);
  assert.equal(f.service.readiness().nativeExecutionReady, false);
}));
test("missing or revoked durable readiness prevents orchestration", async () => fixture(f => {
  assert.equal(RuntimeMobileBuilds.initialize({ environment: { NODE_ENV: "production" } }).service, null);
  f.service.close(); reject(() => claim(f), "closed");
  const lifecycle = new MobileBuildLifecycle(); reject(() => lifecycle.claim(f.record.request.requestId, 0, last(f.record).attemptId, "worker", f.context), "orchestration_unavailable");
}));
test("request admission rejects invalid specification and cross-project identity", async () => fixture(f => {
  reject(() => f.service.create({ ...f.input, specificationFingerprint: "c".repeat(64) }, f.specification, f.context), "invalid_specification");
  reject(() => f.service.create({ ...f.input, projectId: "other" }, f.specification, f.context), "project_mismatch");
}));
test("claim rejects stale snapshot, source commit and package evidence before state change", async () => fixture(f => {
  for (const snapshot of [{ ...f.context.snapshot, fingerprint: "c".repeat(64) }, { ...f.context.snapshot, commit: "c".repeat(40) }, { ...f.context.snapshot, read: () => "tampered" }]) {
    reject(() => f.service.claim(f.record.request.requestId, 0, last(f.record).attemptId, "worker", { ...f.context, snapshot }), "invalid_specification");
  }
  assert.equal(f.service.get(f.record.request.requestId, f.context).sequence, 0);
}));
for (const source of ["anonymous", "local-headers", "development-identity", "rejected-token"] as const) test(`${source} cannot establish worker authority`, async () => fixture(f => {
  reject(() => f.service.claim(f.record.request.requestId, 0, last(f.record).attemptId, "worker", { ...f.context, identity: { ...f.context.identity, source } }), "access_denied");
}));
test("concurrent claim contenders cannot both win one lifecycle version", async () => fixture(async f => {
  const outcomes = await Promise.allSettled(["one", "two"].map(workerId => Promise.resolve().then(() => claim(f, f.record, workerId))));
  assert.equal(outcomes.filter(outcome => outcome.status === "fulfilled").length, 1);
  const rejected = outcomes.find(outcome => outcome.status === "rejected") as PromiseRejectedResult; assert.equal(rejected.reason.code, "stale_transition");
  const current = f.service.get(f.record.request.requestId, f.context); reject(() => claim(f, current, "two"), "lease_conflict");
}));
for (const ttl of [0, 4999, 300001, NaN, 1.5]) test(`TTL ${ttl} fails closed`, async () => fixture(f => { reject(() => claim(f, f.record, "worker", ttl), "invalid_lease"); }));
test("worker identity and attempt identity must be explicit and valid", async () => fixture(f => {
  reject(() => claim(f, f.record, "../worker"), "invalid_lease");
  reject(() => f.service.claim(f.record.request.requestId, 0, "wrong-attempt", "worker", f.context), "stale_transition");
}));
test("renewal retains the fencing token and durable execution deadline", async () => fixture(f => {
  const record = claim(f); f.clock.now += 5000;
  const renewed = f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context);
  assert.equal(last(renewed).workerLease!.fencingToken, proof(record).fencingToken); assert.equal(last(renewed).workerLease!.renewals, 1);
  assert.equal(last(renewed).workerLease!.deadline, last(record).workerLease!.deadline); assert.ok(last(renewed).workerLease!.expiresAt > last(record).workerLease!.expiresAt);
  reject(() => f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context), "stale_transition");
}));
test("renewals are bounded even when the worker remains active", async () => fixture(f => {
  let record = claim(f, f.record, "worker", 5000);
  for (let count = 0; count < MOBILE_WORKER_LEASE_POLICY.maximumRenewals; count++) { f.clock.now += 1000; record = f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context, 5000); }
  f.clock.now += 1000;
  reject(() => f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context, 5000), "lease_limit");
}));
test("execution deadline cannot be extended by renewal", async () => fixture(f => {
  let record = claim(f, f.record, "worker", 300000);
  for (let i = 0; i < 3; i++) { f.clock.now += 250000; record = f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context, 300000); }
  assert.equal(last(record).workerLease!.expiresAt, last(record).workerLease!.deadline);
  f.clock.now = last(record).workerLease!.deadline;
  reject(() => f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context), "lease_expired");
}));
test("expired leases cannot renew, transition or regain the same attempt", async () => fixture(f => {
  const record = claim(f); f.clock.now = last(record).workerLease!.expiresAt;
  reject(() => f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context), "lease_expired");
  reject(() => f.service.transition(record.request.requestId, command(record, { type: "verify" }), f.context, proof(record)), "lease_expired");
  reject(() => claim(f, record, "new-worker"), "lease_conflict");
}));
test("clock rollback never extends worker authority", async () => fixture(f => {
  const record = claim(f); f.clock.now -= 1;
  reject(() => f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, proof(record), f.context), "clock_rollback");
}));
test("missing, wrong and stale fencing proofs cannot mutate lifecycle state", async () => fixture(f => {
  reject(() => f.service.transition(f.record.request.requestId, command(f.record, { type: "start" }), f.context), "worker_lease_required");
  const record = claim(f);
  reject(() => f.service.transition(record.request.requestId, command(record, { type: "verify" }), f.context), "worker_lease_required");
  for (const token of [{ ...proof(record), workerId: "other" }, { ...proof(record), fencingToken: 0 }]) reject(() => f.service.transition(record.request.requestId, command(record, { type: "verify" }), f.context, token), "fence_rejected");
}));
test("cancellation blocks renewal and completion but accepts fenced worker acknowledgment", async () => fixture(f => {
  let record = claim(f); const token = proof(record);
  record = f.service.transition(record.request.requestId, command(record, { type: "cancel" }), f.context);
  reject(() => f.service.renew(record.request.requestId, record.sequence, last(record).attemptId, token, f.context), "invalid_transition");
  reject(() => f.service.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), f.context, token), "invalid_transition");
  record = f.service.transition(record.request.requestId, command(record, { type: "cancelled" }), f.context, token);
  assert.equal(last(record).state, "cancelled"); assert.equal(last(record).workerLease!.status, "revoked");
}));
test("recovery terminalizes expired claims with durable evidence and isolates retries", async () => fixture(f => {
  const record = claim(f); const token = proof(record); f.clock.now = last(record).workerLease!.expiresAt;
  const failed = f.service.recover(record.request.requestId, record.sequence, last(record).attemptId, f.context);
  assert.equal(last(failed).state, "failed"); assert.equal(last(failed).failure!.classification, "timeout"); assert.equal(last(failed).workerLease!.status, "revoked");
  assert.ok(last(failed).diagnosticReferences.includes(`worker-lease-expired:${token.fencingToken}`));
  const retried = f.service.retry(record.request.requestId, failed.sequence, f.context); const next = claim(f, retried, "worker-two");
  assert.notEqual(last(next).attemptId, last(record).attemptId); assert.ok(proof(next).fencingToken > token.fencingToken);
  reject(() => f.service.transition(next.request.requestId, command(next, { type: "verify" }), f.context, token), "fence_rejected");
  reject(() => f.service.transition(next.request.requestId, { ...command(next, { type: "verify" }), attemptId: last(record).attemptId }, f.context, token), "stale_transition");
}));
test("recovery cannot steal active work or reopen a terminal attempt", async () => fixture(f => {
  const record = claim(f); reject(() => f.service.recover(record.request.requestId, record.sequence, last(record).attemptId, f.context), "invalid_transition");
  f.clock.now += 60000; const failed = f.service.recover(record.request.requestId, record.sequence, last(record).attemptId, f.context);
  reject(() => f.service.recover(record.request.requestId, failed.sequence, last(failed).attemptId, f.context), "invalid_transition");
}));
test("Runtime restart restores the same claim and recovers it only after expiration", async () => fixture(f => {
  const record = claim(f); f.service.close(); const restarted = f.open();
  assert.deepEqual(restarted.get(record.request.requestId, f.context), record);
  reject(() => restarted.claim(record.request.requestId, record.sequence, last(record).attemptId, "new-worker", f.context), "lease_conflict");
  f.clock.now += 60000; const failed = restarted.recover(record.request.requestId, record.sequence, last(record).attemptId, f.context);
  assert.equal(last(failed).state, "failed");
}));
test("cross-project and view-only identities cannot claim or recover work", async () => fixture(f => {
  const other = { ...f.context, projectId: "other", metadata: { ...f.context.metadata!, projectId: "other" } };
  reject(() => f.service.claim(f.record.request.requestId, 0, last(f.record).attemptId, "worker", other), "request_not_found");
  const teammate: MobilePackageValidationContext = { ...f.context, metadata: { ...f.context.metadata!, teamId: "team" }, identity: { source: "internal-token", caller: { userId: "bob", teamId: "team", role: "pro", supportAccess: false, adminTools: false } } };
  reject(() => f.service.claim(f.record.request.requestId, 0, last(f.record).attemptId, "worker", teammate), "access_denied");
}));
test("a valid worker still cannot complete without independent artifact verification", async () => fixture(f => {
  let record = claim(f); const token = proof(record); record = f.service.transition(record.request.requestId, command(record, { type: "verify" }), f.context, token);
  reject(() => f.service.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), f.context, token), "artifact_not_verified");
  reject(() => f.service.transition(record.request.requestId, { ...command(record, { type: "complete", artifactReference: "artifact:one" }), exitCode: 0 } as unknown as MobileBuildCommand, f.context, token), "invalid_request");
}));
test("verified artifact completion revokes ownership and remains terminal", async () => fixture(f => {
  f.service.close(); const service = f.open(artifactFixture); let record = service.claim(f.record.request.requestId, 0, last(f.record).attemptId, "worker", f.context); const token = proof(record);
  record = service.transition(record.request.requestId, command(record, { type: "verify" }), f.context, token);
  record = service.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), f.context, token);
  assert.equal(last(record).state, "completed"); assert.equal(last(record).workerLease!.status, "revoked"); assert.equal(record.distributionVerification, "not-performed");
  reject(() => service.retry(record.request.requestId, record.sequence, f.context), "retry_denied");
}));
test("lease expiry during artifact verification prevents completion", async () => fixture(f => {
  f.service.close(); const service = f.open((ref, expected) => { f.clock.now += 60000; return artifactFixture(ref, expected); });
  let record = service.claim(f.record.request.requestId, 0, last(f.record).attemptId, "worker", f.context); const token = proof(record);
  record = service.transition(record.request.requestId, command(record, { type: "verify" }), f.context, token);
  reject(() => service.transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), f.context, token), "lease_expired");
  assert.equal(last(service.get(record.request.requestId, f.context)).state, "verifying");
}));
test("claim persistence failure never grants execution eligibility", async t => fixture(f => {
  const injected = t.mock.method(fs, "linkSync", () => { throw Object.assign(new Error("write failed"), { code: "ENOSPC" }); });
  reject(() => claim(f), "persistence_unavailable"); injected.mock.restore(); assert.equal(f.service.readiness().ready, false);
  f.service.close(); const restarted = f.open(); assert.equal(restarted.get(f.record.request.requestId, f.context).sequence, 0);
}));
test("legacy unowned active work is failed rather than adopted by a worker", async () => fixture(f => {
  f.service.close(); const legacy = new MobileBuildLifecycle(undefined, new FileMobileBuildStore({ storageRoot: f.root }));
  const running = legacy.transition(f.record.request.requestId, command(f.record, { type: "start" }), f.context);
  const service = f.open(); const failed = service.recover(running.request.requestId, running.sequence, last(running).attemptId, f.context);
  assert.equal(last(failed).failure!.classification, "executor_unavailable"); assert.ok(last(failed).diagnosticReferences.includes("worker-ownership-unavailable"));
}));


test("independent control-plane processes cannot publish two worker claims for one version", async () => fixture(async f => {
  const url = (name: string) => pathToFileURL(path.resolve(`apps/lumina-runtime/src/mobile/${name}.ts`)).href;
  const payload = path.join(f.temporary, "race.json"); fs.writeFileSync(payload, JSON.stringify({ context: f.context, contents: f.contents, record: f.record, now: f.clock.now }));
  // Runtime-owned control-plane fixture contenders, not executable native worker adapters.
  const script = `import fs from 'node:fs';import {MobileBuildLifecycle} from ${JSON.stringify(url("MobileBuildLifecycle"))};import {FileMobileBuildStore} from ${JSON.stringify(url("MobileBuildStore"))};
const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));p.context.snapshot.read=file=>p.contents[file];p.context.snapshot.readSensitive=()=>{throw Error('forbidden')};
const lifecycle=new MobileBuildLifecycle(undefined,new FileMobileBuildStore({storageRoot:process.argv[2]}),{requireWorkerLease:true,now:()=>p.now});
process.on('message',()=>{try{const r=lifecycle.claim(p.record.request.requestId,0,p.record.attempts[0].attemptId,process.argv[3],p.context);process.send({kind:'result',ok:true,fence:r.attempts[0].workerLease.fencingToken});}catch(e){process.send({kind:'result',ok:false,code:e.code});}finally{process.disconnect();}});process.send({kind:'ready'});`;
  const children = ["worker-one", "worker-two"].map(id => spawn(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script, payload, f.root, id], { stdio: ["ignore", "pipe", "pipe", "ipc"] }));
  try {
    await Promise.all(children.map(child => new Promise<void>((resolve, reject) => { child.on("message", message => { if ((message as {kind:string}).kind === "ready") resolve(); }); child.on("error", reject); child.on("exit", code => reject(new Error(`early exit ${code}`))); })));
    const outcomes = children.map(child => new Promise<{ok:boolean;code?:string;fence?:number}>((resolve, reject) => { child.on("message", message => { if ((message as {kind:string}).kind === "result") resolve(message as never); }); child.on("error", reject); }));
    children.forEach(child => child.send("go")); const results = await Promise.all(outcomes);
    assert.equal(results.filter(result => result.ok).length, 1); assert.equal(results.find(result => !result.ok)!.code, "stale_transition");
    assert.equal(f.service.get(f.record.request.requestId, f.context).sequence, 1);
  } finally { await Promise.all(children.map(child => new Promise<void>(resolve => { if (child.exitCode !== null) resolve(); else child.once("exit", () => resolve()); }))); }
}));
test("worker failure terminalization revokes fencing and respects nonretryable classification", async () => fixture(f => {
  let record = claim(f); record = f.service.transition(record.request.requestId, command(record, { type: "fail", reason: "build_failure" }), f.context, proof(record));
  assert.equal(last(record).workerLease!.status, "revoked"); assert.deepEqual(last(record).failure, { classification: "build_failure", retryable: false });
  reject(() => f.service.retry(record.request.requestId, record.sequence, f.context), "retry_denied");
}));


test("expired cancellation is failed deterministically without asserting native termination", async () => fixture(f => {
  let record = claim(f); record = f.service.transition(record.request.requestId, command(record, { type: "cancel" }), f.context);
  f.clock.now = last(record).workerLease!.expiresAt;
  record = f.service.recover(record.request.requestId, record.sequence, last(record).attemptId, f.context);
  assert.equal(last(record).state, "failed"); assert.equal(last(record).failure!.classification, "timeout"); assert.equal(last(record).workerLease!.status, "revoked");
}));
