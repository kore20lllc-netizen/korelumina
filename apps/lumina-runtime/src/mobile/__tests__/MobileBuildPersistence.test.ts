import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";
import type { RepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
import { analyzeMobileCompatibility } from "../analyzeMobileCompatibility.js";
import { MOBILE_PACKAGE_SPECIFICATION_VERSION, type MobilePackageValidationContext } from "../MobilePackageSpecification.js";
import { validateMobilePackageSpecification } from "../validateMobilePackageSpecification.js";
import { MobileBuildLifecycle } from "../MobileBuildLifecycle.js";
import { FileMobileBuildStore, MobileBuildPersistenceError } from "../MobileBuildStore.js";
import { MobileBuildContractError, mobileBuildHash, type MobileArtifactVerifier, type MobileBuildCommand, type MobileBuildRecord } from "../MobileBuildRequest.js";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
function fixture() {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "klm-mobile-persistence-"));
  const contents: Record<string, string> = { "package.json": JSON.stringify({ dependencies: { react: "18", vite: "5" }, scripts: { build: "vite build" } }), "index.html": "<head></head>", "src/main.tsx": "NeverExecute();" };
  const files = Object.keys(contents).sort().map(path => ({ path, bytes: Buffer.byteLength(contents[path]), sha256: hash(contents[path]), text: true, ignored: false, tracked: null }));
  const snapshot: RepositorySnapshot = { root: "/runtime/projects/shop", files, fingerprint: hash(files.map(f => `${f.path}\0${f.sha256}`).join("\n")), commit: "a".repeat(40), skippedDirectories: [], read: file => contents[file], readSensitive: () => { throw new Error("forbidden"); } };
  const context: MobilePackageValidationContext = { projectId: "shop", repositoryRoot: snapshot.root, snapshot, metadata: { projectId: "shop", ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 }, identity: { source: "verified-token", caller: { userId: "alice", role: "pro", supportAccess: false, adminTools: false } } };
  const compatibility = analyzeMobileCompatibility(snapshot, { applicationRoot: "." });
  const specification = validateMobilePackageSpecification({ schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId: "shop", applicationRoot: ".", target: "android", applicationName: "Shop", applicationIdentifier: "com.example.shop", version: "1.0.0", buildNumber: 1, sourceSnapshotFingerprint: snapshot.fingerprint, compatibilityReportFingerprint: compatibility.reportFingerprint, nativeCapabilities: [], permissions: [], build: { mode: "release", webAssetsDirectory: "dist" }, artifact: { format: "aab", signing: "required" } }, context);
  const input = { projectId: "shop", specificationFingerprint: specification.specificationFingerprint, operation: "package", idempotencyKey: "request-1", maxAttempts: 3 };
  const storageRoot = path.join(temporary, "data");
  const store = () => new FileMobileBuildStore({ storageRoot });
  const authority = (verify?: MobileArtifactVerifier) => new MobileBuildLifecycle(verify, store());
  return { temporary, contents, specification, input, context, storageRoot, store, authority };
}
async function isolated(run: (f: ReturnType<typeof fixture>) => void | Promise<void>) {
  const f = fixture(); try { await run(f); } finally { fs.rmSync(f.temporary, { recursive: true, force: true }); assert.equal(fs.existsSync(f.temporary), false); }
}
const current = (record: MobileBuildRecord) => record.attempts[record.attempts.length - 1];
const command = (record: MobileBuildRecord, action: Record<string, unknown>) => ({ expectedSequence: record.sequence, attemptId: current(record).attemptId, ...action }) as MobileBuildCommand;
function rejected(run: () => unknown, code: string) { assert.throws(run, error => (error instanceof MobileBuildContractError || error instanceof MobileBuildPersistenceError) && error.code === code); }
function group(f: ReturnType<typeof fixture>): string { return path.join(f.storageRoot, "shop", fs.readdirSync(path.join(f.storageRoot, "shop"))[0]); }
const contractEvidence: MobileArtifactVerifier = (reference, expected) => ({ reference, requestId: expected.request.requestId, attemptId: expected.attemptId, projectId: expected.request.projectId, target: expected.request.target, format: expected.specification.artifact.format, applicationIdentifier: expected.specification.applicationIdentifier, version: expected.specification.version, buildNumber: expected.specification.buildNumber, sourceSnapshotFingerprint: expected.request.sourceSnapshotFingerprint, specificationFingerprint: expected.specification.specificationFingerprint, sha256: "b".repeat(64), bytes: 1234, verification: "verified", signing: "verified" });

test("durable immutable request and specification survive authority reinitialization", async () => isolated(f => {
  const first = f.authority().create(f.input, f.specification, f.context); const restored = f.authority().get(first.request.requestId, f.context);
  assert.deepEqual(restored, first); assert.ok(Object.isFrozen(restored.request));
  assert.equal(f.store().read("shop", first.request.requestId)!.specification.specificationFingerprint, f.specification.specificationFingerprint);
}));
test("restart-safe idempotency returns current state and conflicts do not create a second build", async () => isolated(f => {
  let record = f.authority().create(f.input, f.specification, f.context);
  record = f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context);
  assert.deepEqual(f.authority().create(f.input, f.specification, f.context), record);
  rejected(() => f.authority().create({ ...f.input, maxAttempts: 2 }, f.specification, f.context), "idempotency_conflict");
  assert.equal(fs.readdirSync(path.join(f.storageRoot, "shop")).length, 1);
}));
test("CAS rejects stale transitions across independent authorities without losing history", async () => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  const next = f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context);
  rejected(() => f.authority().transition(record.request.requestId, command(record, { type: "cancel" }), f.context), "stale_transition");
  assert.deepEqual(f.authority().history(record.request.requestId, f.context), [record, next]);
}));
test("cancellation, retries, bounded attempts and terminal states survive restarts", async () => isolated(f => {
  let record = f.authority().create({ ...f.input, maxAttempts: 2 }, f.specification, f.context);
  record = f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context);
  record = f.authority().transition(record.request.requestId, command(record, { type: "cancel" }), f.context);
  assert.equal(current(f.authority().get(record.request.requestId, f.context)).state, "cancelling");
  record = f.authority().transition(record.request.requestId, command(record, { type: "cancelled" }), f.context);
  rejected(() => f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context), "invalid_transition");
  const previousId = current(record).attemptId; record = f.authority().retry(record.request.requestId, record.sequence, f.context);
  assert.notEqual(current(record).attemptId, previousId); assert.equal(record.attempts[0].state, "cancelled");
  record = f.authority().transition(record.request.requestId, command(record, { type: "fail", reason: "timeout" }), f.context);
  rejected(() => f.authority().retry(record.request.requestId, record.sequence, f.context), "retry_denied");
  assert.equal(f.authority().history(record.request.requestId, f.context).length, record.sequence + 1);
}));
test("project, application and actor isolation are retained after restoration", async () => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  const other = { ...f.context, projectId: "other", metadata: { ...f.context.metadata!, projectId: "other" } };
  rejected(() => f.authority().get(record.request.requestId, other), "request_not_found");
  const stranger = { ...f.context, identity: { ...f.context.identity, caller: { ...f.context.identity.caller, userId: "mallory" } } };
  rejected(() => f.authority().get(record.request.requestId, stranger), "access_denied");
  rejected(() => f.authority().history(record.request.requestId, stranger), "access_denied");
  rejected(() => f.authority().create(f.input, Object.freeze({ ...f.specification, applicationIdentifier: "com.other.app" }), f.context), "invalid_specification");
}));
test("completion still requires independent artifact evidence and remains terminal after restart", async () => isolated(f => {
  let record = f.authority().create(f.input, f.specification, f.context);
  for (const type of ["start", "verify"]) record = f.authority().transition(record.request.requestId, command(record, { type }), f.context);
  rejected(() => f.authority().transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), f.context), "artifact_not_verified");
  rejected(() => f.authority((ref, expected) => ({ ...contractEvidence(ref, expected)!, sourceSnapshotFingerprint: "c".repeat(64) })).transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), f.context), "artifact_not_verified");
  record = f.authority(contractEvidence).transition(record.request.requestId, command(record, { type: "complete", artifactReference: "artifact:one" }), f.context);
  assert.deepEqual(f.authority().get(record.request.requestId, f.context), record);
  rejected(() => f.authority().retry(record.request.requestId, record.sequence, f.context), "retry_denied");
}));
test("corrupt, truncated, missing and out-of-order revisions fail closed", async () => {
  for (const mode of ["json", "checksum", "missing", "gap"]) await isolated(f => {
    let record = f.authority().create(f.input, f.specification, f.context);
    record = f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context);
    const directory = group(f);
    if (mode === "json") fs.writeFileSync(path.join(directory, "000001.json"), "{truncated");
    if (mode === "checksum") fs.writeFileSync(path.join(directory, "000001.json"), fs.readFileSync(path.join(directory, "000001.json"), "utf8").replace('"running"', '"completed"'));
    if (mode === "missing") fs.unlinkSync(path.join(directory, "000000.json"));
    if (mode === "gap") fs.renameSync(path.join(directory, "000001.json"), path.join(directory, "000002.json"));
    rejected(() => f.authority().get(record.request.requestId, f.context), "persistence_corrupt");
    rejected(() => f.authority().create(f.input, f.specification, f.context), "persistence_corrupt");
  });
});
test("crash leftovers are ignored while published history remains authoritative", async () => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  fs.writeFileSync(path.join(group(f), "crash.tmp"), "incomplete unpublished bytes");
  assert.deepEqual(f.authority().get(record.request.requestId, f.context), record);
  assert.deepEqual(f.authority().create(f.input, f.specification, f.context), record);
}));
test("unsafe storage paths and symlinks fail closed", async () => isolated(f => {
  fs.writeFileSync(f.storageRoot, "not a directory");
  rejected(() => f.authority().create(f.input, f.specification, f.context), "persistence_unavailable");
  fs.unlinkSync(f.storageRoot); fs.mkdirSync(path.join(f.temporary, "outside")); fs.symlinkSync(path.join(f.temporary, "outside"), f.storageRoot);
  rejected(() => f.authority().create(f.input, f.specification, f.context), "persistence_unavailable");
  assert.deepEqual(fs.readdirSync(path.join(f.temporary, "outside")), []);
}));
test("write and sync failures do not acknowledge or advance lifecycle state", async t => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  const injected = t.mock.method(fs, "fsyncSync", () => { throw Object.assign(new Error("sensitive detail"), { code: "EIO" }); });
  rejected(() => f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context), "persistence_unavailable");
  injected.mock.restore();
  assert.deepEqual(f.authority().get(record.request.requestId, f.context), record);
  assert.ok(!fs.readdirSync(group(f)).some(file => file.endsWith(".tmp")));
}));
test("publication failure preserves the previous committed revision", async t => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  const injected = t.mock.method(fs, "linkSync", () => { throw Object.assign(new Error("sensitive detail"), { code: "ENOSPC" }); });
  rejected(() => f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context), "persistence_unavailable");
  injected.mock.restore(); assert.deepEqual(f.authority().get(record.request.requestId, f.context), record);
}));

async function worker(f: ReturnType<typeof fixture>, action: string, patch = {}) {
  const payload = path.join(f.temporary, `${hash(JSON.stringify({ action, patch }))}.json`);
  fs.writeFileSync(payload, JSON.stringify({ specification: f.specification, context: f.context, input: { ...f.input, ...patch }, contents: f.contents }));
  const moduleUrl = (name: string) => pathToFileURL(path.resolve(`apps/lumina-runtime/src/mobile/${name}.ts`)).href;
  const script = `import fs from 'node:fs';
import { MobileBuildLifecycle } from ${JSON.stringify(moduleUrl("MobileBuildLifecycle"))};
import { FileMobileBuildStore } from ${JSON.stringify(moduleUrl("MobileBuildStore"))};
import { freezeMobileBuildValue, createMobileBuildRequest } from ${JSON.stringify(moduleUrl("MobileBuildRequest"))};
const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));p.context.snapshot.read=file=>p.contents[file];p.context.snapshot.readSensitive=()=>{throw Error('forbidden')};
const lifecycle=new MobileBuildLifecycle(undefined,new FileMobileBuildStore({storageRoot:process.argv[2]}));
process.on('message',()=>{try{const specification=freezeMobileBuildValue(p.specification);const r=process.argv[3]==='read'?lifecycle.get(createMobileBuildRequest(p.input,specification,p.context).requestId,p.context):lifecycle.create(p.input,specification,p.context);let result=r;
if(process.argv[3]==='transition') result=lifecycle.transition(r.request.requestId,{expectedSequence:0,attemptId:r.attempts[0].attemptId,type:'start'},p.context);
process.send({ok:true,requestId:result.request.requestId,sequence:result.sequence});}catch(e){process.send({ok:false,code:e.code});}finally{process.disconnect();}});process.send({ready:true});`;
  const child = spawn(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script, payload, f.storageRoot, action], { stdio: ["ignore", "pipe", "pipe", "ipc"] });
  let stderr = ""; child.stderr!.on("data", chunk => { stderr += chunk; });
  const result = new Promise<{ ok: boolean; requestId?: string; sequence?: number; code?: string }>((resolve, reject) => {
    child.on("message", message => { if (!(message as { ready?: boolean }).ready) resolve(message as never); }); child.on("error", reject);
    child.on("exit", code => { if (code) reject(new Error(stderr)); });
  });
  await new Promise<void>((resolve, reject) => { child.on("message", message => { if ((message as { ready?: boolean }).ready) resolve(); }); child.on("error", reject); child.on("exit", () => reject(new Error(stderr))); });
  return { child, result };
}
for (const mode of ["duplicate", "conflict", "transition"]) test(`independent processes enforce atomic ${mode} exclusion`, async () => isolated(async f => {
  if (mode === "transition") f.authority().create(f.input, f.specification, f.context);
  const workers = await Promise.all([worker(f, mode === "transition" ? "transition" : "create"), worker(f, mode === "transition" ? "transition" : "create", mode === "conflict" ? { maxAttempts: 2 } : {})]);
  try {
    workers.forEach(w => w.child.send("go")); const results = await Promise.all(workers.map(w => w.result));
    if (mode === "duplicate") { assert.ok(results.every(r => r.ok)); assert.equal(results[0].requestId, results[1].requestId); }
    else { assert.equal(results.filter(r => r.ok).length, 1); assert.equal(results.find(r => !r.ok)!.code, mode === "conflict" ? "idempotency_conflict" : "stale_transition"); }
    assert.equal(fs.readdirSync(path.join(f.storageRoot, "shop")).length, 1);
    const id = results.find(r => r.ok)!.requestId!; assert.equal(f.authority().history(id, f.context).length, mode === "transition" ? 2 : 1);
  } finally {
    await Promise.all(workers.map(w => new Promise<void>(resolve => { if (w.child.exitCode !== null) resolve(); else w.child.once("exit", () => resolve()); })));
  }
}));
test("terminal revision reopening is rejected even with recalculated journal checksums", async () => isolated(f => {
  let record = f.authority().create(f.input, f.specification, f.context);
  record = f.authority().transition(record.request.requestId, command(record, { type: "cancel" }), f.context);
  const prior = JSON.parse(fs.readFileSync(path.join(group(f), "000001.json"), "utf8"));
  const entry = JSON.parse(JSON.stringify(prior.entry)); entry.record.sequence = 2; entry.record.attempts[0].state = "running";
  const body = { schemaVersion: "mobile-build-journal:v1", previousFingerprint: prior.fingerprint, entry };
  fs.writeFileSync(path.join(group(f), "000002.json"), JSON.stringify({ ...body, fingerprint: mobileBuildHash(body) }));
  rejected(() => f.authority().get(record.request.requestId, f.context), "persistence_corrupt");
}));


test("post-publication sync failure reports an uncertain commit and recovers through a fresh read", async t => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  const original = fs.fsyncSync; let published = false;
  const originalLink = fs.linkSync;
  const link = t.mock.method(fs, "linkSync", (...args: Parameters<typeof fs.linkSync>) => { originalLink(...args); published = true; });
  const sync = t.mock.method(fs, "fsyncSync", (fd: number) => { if (published) throw Object.assign(new Error("sync failed"), { code: "EIO" }); original(fd); });
  rejected(() => f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context), "persistence_commit_uncertain");
  sync.mock.restore(); link.mock.restore();
  const recovered = f.authority().get(record.request.requestId, f.context);
  assert.equal(recovered.sequence, 1); assert.equal(current(recovered).state, "running");
  assert.deepEqual(f.authority().create(f.input, f.specification, f.context), recovered);
}));


test("a new Runtime process retrieves committed state after the writer has exited", async () => isolated(async f => {
  const waitExit = (child: Awaited<ReturnType<typeof worker>>["child"]) => new Promise<void>(resolve => { if (child.exitCode !== null) resolve(); else child.once("exit", () => resolve()); });
  const writer = await worker(f, "create"); writer.child.send("go");
  const written = await writer.result; await waitExit(writer.child); assert.equal(written.ok, true);
  const reader = await worker(f, "read"); reader.child.send("go");
  const restored = await reader.result; await waitExit(reader.child);
  assert.equal(restored.ok, true); assert.equal(restored.requestId, written.requestId); assert.equal(restored.sequence, 0);
}));

test("temporary-file write failure leaves committed state unchanged", async t => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  const original = fs.writeFileSync;
  const injected = t.mock.method(fs, "writeFileSync", (...args: Parameters<typeof fs.writeFileSync>) => {
    if (typeof args[0] === "number") throw Object.assign(new Error("write failed"), { code: "EIO" });
    original(...args);
  });
  rejected(() => f.authority().transition(record.request.requestId, command(record, { type: "start" }), f.context), "persistence_unavailable");
  injected.mock.restore(); assert.deepEqual(f.authority().get(record.request.requestId, f.context), record);
  assert.deepEqual(fs.readdirSync(group(f)), ["000000.json"]);
}));
test("storage read failures never become missing projects or forgotten idempotency keys", async t => isolated(f => {
  const record = f.authority().create(f.input, f.specification, f.context);
  const injected = t.mock.method(fs, "readFileSync", () => { throw Object.assign(new Error("read denied"), { code: "EACCES" }); });
  rejected(() => f.authority().get(record.request.requestId, f.context), "persistence_unavailable");
  rejected(() => f.authority().create(f.input, f.specification, f.context), "persistence_unavailable");
  injected.mock.restore(); assert.deepEqual(f.authority().create(f.input, f.specification, f.context), record);
}));
