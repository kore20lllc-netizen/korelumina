import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { RuntimeMobileBuilds, RuntimeMobileBuildUnavailable } from "../RuntimeMobileBuilds.js";
import { MobileBuildContractError } from "../MobileBuildRequest.js";
import { MobileBuildPersistenceError } from "../MobileBuildStore.js";
import { validateMobilePackageSpecification } from "../validateMobilePackageSpecification.js";
import { MOBILE_PACKAGE_SPECIFICATION_VERSION, type MobilePackageValidationContext } from "../MobilePackageSpecification.js";
import { analyzeMobileCompatibility } from "../analyzeMobileCompatibility.js";
import type { RepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
async function isolated(run: (f: { root: string; temporary: string; environment: NodeJS.ProcessEnv; open(): RuntimeMobileBuilds }) => void | Promise<void>) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "klm-mobile-runtime-"));
  const root = path.join(temporary, "mobile-builds"); fs.mkdirSync(root, { mode: 0o700 });
  const environment = { NODE_ENV: "production", KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: root, KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "exclusive-local" };
  const services: RuntimeMobileBuilds[] = [];
  const open = () => { const result = RuntimeMobileBuilds.initialize({ environment }); assert.equal(result.ready, true, result.readiness.reason); if (!result.ready) throw new Error("not ready"); services.push(result.service); return result.service; };
  try { await run({ root, temporary, environment, open }); }
  finally { services.reverse().forEach(service => service.close()); fs.rmSync(temporary, { recursive: true, force: true }); assert.equal(fs.existsSync(temporary), false); }
}
function packageFixture() {
  const contents: Record<string, string> = { "package.json": JSON.stringify({ dependencies: { react: "18", vite: "5" }, scripts: { build: "vite build" } }), "index.html": "<head></head>", "src/main.tsx": "NeverExecute();" };
  const files = Object.keys(contents).sort().map(path => ({ path, bytes: Buffer.byteLength(contents[path]), sha256: hash(contents[path]), text: true, ignored: false, tracked: null }));
  const snapshot: RepositorySnapshot = { root: "/runtime/projects/shop", files, fingerprint: hash(files.map(f => `${f.path}\0${f.sha256}`).join("\n")), commit: null, skippedDirectories: [], read: file => contents[file], readSensitive: () => { throw new Error("forbidden"); } };
  const context: MobilePackageValidationContext = { projectId: "shop", repositoryRoot: snapshot.root, snapshot, metadata: { projectId: "shop", ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 }, identity: { source: "verified-token", caller: { userId: "alice", role: "pro", supportAccess: false, adminTools: false } } };
  const report = analyzeMobileCompatibility(snapshot, { applicationRoot: "." });
  const specification = validateMobilePackageSpecification({ schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId: "shop", applicationRoot: ".", target: "android", applicationName: "Shop", applicationIdentifier: "com.example.shop", version: "1.0.0", buildNumber: 1, sourceSnapshotFingerprint: snapshot.fingerprint, compatibilityReportFingerprint: report.reportFingerprint, nativeCapabilities: [], permissions: [], build: { mode: "debug", webAssetsDirectory: "dist" }, artifact: { format: "apk", signing: "unsigned" } }, context);
  return { context, specification, input: { projectId: "shop", specificationFingerprint: specification.specificationFingerprint, operation: "package", idempotencyKey: "request-one", maxAttempts: 2 } };
}
test("readiness follows actual durable I/O and exclusive-publication probes", async () => isolated(f => {
  const service = f.open(); const readiness = service.readiness();
  assert.deepEqual(readiness.checks, { ownerClaim: true, writeReadSync: true, exclusivePublication: true });
  assert.equal(readiness.storage, "durable-file"); assert.equal(readiness.nativeExecutionReady, false); assert.ok(Object.isFrozen(readiness));
  assert.deepEqual(fs.readdirSync(f.root), [".runtime-owner"]); assert.ok(!JSON.stringify(readiness).includes(f.root));
}));
for (const environment of [{}, { NODE_ENV: "production" }, { KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: "/private/tmp" }, { KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "exclusive-local" }]) test(`missing configuration rejects initialization ${JSON.stringify(environment)}`, () => {
  const result = RuntimeMobileBuilds.initialize({ environment }); assert.equal(result.ready, false); assert.equal(result.service, null); assert.equal(result.readiness.reason, "storage_configuration_missing");
});
for (const patch of [{ KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: "relative" }, { KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: "/" }, { KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: "/private/tmp/../tmp" }, { KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "shared" }, { KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "memory" }]) test(`invalid configuration fails closed ${JSON.stringify(patch)}`, async () => isolated(f => {
  const result = RuntimeMobileBuilds.initialize({ environment: { ...f.environment, ...patch } }); assert.equal(result.ready, false); assert.equal(result.readiness.reason, "storage_configuration_invalid"); assert.equal(result.service, null);
}));
test("missing storage directory is not silently created or replaced by memory", async () => isolated(f => {
  fs.rmdirSync(f.root); const result = RuntimeMobileBuilds.initialize({ environment: f.environment });
  assert.equal(result.ready, false); assert.equal(result.readiness.reason, "storage_unavailable"); assert.equal(fs.existsSync(f.root), false);
}));
test("storage must be private, dedicated and free of symlink aliases", async () => isolated(f => {
  fs.chmodSync(f.root, 0o777); assert.equal(RuntimeMobileBuilds.initialize({ environment: f.environment }).readiness.reason, "storage_path_unsafe");
  fs.chmodSync(f.root, 0o700); fs.writeFileSync(path.join(f.root, "unrelated.txt"), "preserve");
  assert.equal(RuntimeMobileBuilds.initialize({ environment: f.environment }).readiness.reason, "storage_path_unsafe"); assert.equal(fs.readFileSync(path.join(f.root, "unrelated.txt"), "utf8"), "preserve");
  const alias = path.join(f.temporary, "alias"); fs.symlinkSync(f.root, alias);
  assert.equal(RuntimeMobileBuilds.initialize({ environment: { ...f.environment, KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: alias } }).readiness.reason, "storage_path_unsafe");
}));
test("inaccessible storage returns a sanitized not-ready result", async t => isolated(f => {
  const injected = t.mock.method(fs, "accessSync", () => { throw Object.assign(new Error("secret path"), { code: "EACCES" }); });
  const result = RuntimeMobileBuilds.initialize({ environment: f.environment }); injected.mock.restore();
  assert.equal(result.ready, false); assert.equal(result.readiness.reason, "storage_unavailable"); assert.equal(result.service, null); assert.ok(!JSON.stringify(result).includes("secret"));
}));
for (const operation of ["linkSync", "fsyncSync", "writeFileSync"] as const) test(`${operation} initialization failure cannot report readiness`, async t => isolated(f => {
  const injected = t.mock.method(fs, operation, () => { throw Object.assign(new Error("probe failed"), { code: "EIO" }); });
  const result = RuntimeMobileBuilds.initialize({ environment: f.environment }); injected.mock.restore();
  assert.equal(result.ready, false); assert.equal(result.readiness.reason, "storage_initialization_failed"); assert.equal(result.service, null);
  assert.ok(!fs.existsSync(path.join(f.root, ".runtime-owner"))); assert.equal(f.open().readiness().ready, true);
}));
test("a filesystem that permits replacement fails the exclusive-publication probe", async t => isolated(f => {
  const original = fs.linkSync;
  const injected = t.mock.method(fs, "linkSync", (...args: Parameters<typeof fs.linkSync>) => { if (fs.existsSync(args[1])) fs.unlinkSync(args[1]); original(...args); });
  const result = RuntimeMobileBuilds.initialize({ environment: f.environment }); injected.mock.restore();
  assert.equal(result.ready, false); assert.equal(result.readiness.reason, "storage_initialization_failed");
}));
test("valid production service retains requests and idempotency after orderly restart", async () => isolated(f => {
  const first = f.open(); const p = packageFixture(); const record = first.create(p.input, p.specification, p.context);
  assert.equal(first.close().reason, "closed"); const restarted = f.open();
  assert.deepEqual(restarted.get(record.request.requestId, p.context), record); assert.deepEqual(restarted.create(p.input, p.specification, p.context), record);
  assert.deepEqual(restarted.history(record.request.requestId, p.context), [record]);
}));
test("concurrent initialization in one process allows one owner and close releases it", async () => isolated(f => {
  const first = f.open(); const other = RuntimeMobileBuilds.initialize({ environment: f.environment });
  assert.equal(other.ready, false); assert.equal(other.readiness.reason, "storage_in_use"); assert.equal(first.readiness().ready, true);
  first.close(); assert.equal(f.open().readiness().ready, true);
}));
test("stale owner claims are never stolen or automatically removed", async () => isolated(f => {
  fs.mkdirSync(path.join(f.root, ".runtime-owner"), { mode: 0o700 });
  fs.writeFileSync(path.join(f.root, ".runtime-owner", "owner.json"), JSON.stringify({ pid: 99999999, token: "old" }));
  assert.equal(RuntimeMobileBuilds.initialize({ environment: f.environment }).readiness.reason, "storage_in_use");
  assert.equal(fs.existsSync(path.join(f.root, ".runtime-owner", "owner.json")), true);
}));
test("ownership loss immediately gates readiness and request admission", async () => isolated(f => {
  const service = f.open(); fs.writeFileSync(path.join(f.root, ".runtime-owner", "owner.json"), JSON.stringify({ token: "replaced" }));
  assert.equal(service.readiness().reason, "storage_ownership_lost"); const p = packageFixture();
  assert.throws(() => service.create(p.input, p.specification, p.context), error => error instanceof RuntimeMobileBuildUnavailable && error.code === "storage_ownership_lost");
  service.close(); assert.ok(fs.existsSync(path.join(f.root, ".runtime-owner")));
}));
test("persistence failures revoke readiness and never trigger memory fallback", async t => isolated(f => {
  const service = f.open(); const p = packageFixture();
  const injected = t.mock.method(fs, "writeFileSync", () => { throw Object.assign(new Error("full"), { code: "ENOSPC" }); });
  assert.throws(() => service.create(p.input, p.specification, p.context), error => error instanceof MobileBuildPersistenceError);
  injected.mock.restore(); assert.equal(service.readiness().reason, "storage_failed");
  assert.throws(() => service.create(p.input, p.specification, p.context), RuntimeMobileBuildUnavailable);
  service.close(); const next = f.open(); assert.equal(next.create(p.input, p.specification, p.context).sequence, 0);
}));
test("authorization failures do not poison storage readiness or bypass project isolation", async () => isolated(f => {
  const service = f.open(); const p = packageFixture(); const record = service.create(p.input, p.specification, p.context);
  const other = { ...p.context, projectId: "other", metadata: { ...p.context.metadata!, projectId: "other" } };
  assert.throws(() => service.get(record.request.requestId, other), error => error instanceof MobileBuildContractError && error.code === "request_not_found");
  const anonymous = { ...p.context, identity: { ...p.context.identity, source: "anonymous" as const } };
  assert.throws(() => service.create(p.input, p.specification, anonymous), MobileBuildContractError); assert.equal(service.readiness().ready, true);
}));
test("close is idempotent and prevents retained callers from accepting requests", async () => isolated(f => {
  const service = f.open(); assert.equal(service.close().reason, "closed"); assert.equal(service.close().reason, "closed");
  const p = packageFixture(); assert.throws(() => service.create(p.input, p.specification, p.context), RuntimeMobileBuildUnavailable);
}));
test("independent Runtime processes cannot both initialize the same storage root", async () => isolated(async f => {
  const url = pathToFileURL(path.resolve("apps/lumina-runtime/src/mobile/RuntimeMobileBuilds.ts")).href;
  const script = `import {RuntimeMobileBuilds} from ${JSON.stringify(url)};let result;process.on('message',message=>{if(message==='go'){result=RuntimeMobileBuilds.initialize({environment:JSON.parse(process.argv[1])});process.send({kind:'result',ready:result.ready,reason:result.readiness.reason});}else{result?.service?.close();process.disconnect();}});process.send({kind:'boot'});`;
  const children = [0, 1].map(() => spawn(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script, JSON.stringify(f.environment)], { stdio: ["ignore", "pipe", "pipe", "ipc"] }));
  try {
    await Promise.all(children.map(child => new Promise<void>((resolve, reject) => { child.on("message", value => { if ((value as { kind: string }).kind === "boot") resolve(); }); child.on("error", reject); child.on("exit", code => reject(new Error(`early exit ${code}`))); })));
    const results = children.map(child => new Promise<{ ready: boolean; reason: string }>((resolve, reject) => { child.on("message", value => { if ((value as { kind: string }).kind === "result") resolve(value as never); }); child.on("error", reject); }));
    children.forEach(child => child.send("go")); const completed = await Promise.all(results);
    assert.equal(completed.filter(result => result.ready).length, 1); assert.equal(completed.find(result => !result.ready)!.reason, "storage_in_use");
  } finally {
    children.forEach(child => { if (child.connected) child.send("close"); });
    await Promise.all(children.map(child => new Promise<void>(resolve => { if (child.exitCode !== null) resolve(); else child.once("exit", () => resolve()); })));
  }
  assert.equal(f.open().readiness().ready, true);
}));


test("corrupt existing lifecycle journals prevent ready initialization", async () => isolated(f => {
  const first = f.open(); const p = packageFixture(); first.create(p.input, p.specification, p.context); first.close();
  const project = path.join(f.root, "shop"); const group = fs.readdirSync(project)[0];
  fs.writeFileSync(path.join(project, group, "000000.json"), "{invalid journal");
  const result = RuntimeMobileBuilds.initialize({ environment: f.environment });
  assert.equal(result.ready, false); assert.equal(result.service, null); assert.equal(result.readiness.reason, "storage_corrupt");
}));
test("an ownership check failure cannot return a contradictory ready result", async t => isolated(f => {
  const original = fs.readFileSync;
  const injected = t.mock.method(fs, "readFileSync", (...args: Parameters<typeof fs.readFileSync>) => {
    if (typeof args[0] === "number") return '{"token":"not-the-owner"}';
    return original(...args);
  });
  const result = RuntimeMobileBuilds.initialize({ environment: f.environment }); injected.mock.restore();
  assert.equal(result.ready, false); assert.equal(result.readiness.ready, false); assert.equal(result.service, null);
}));


test("failed initialization never removes a replacement root's owner claim", async t => isolated(f => {
  const original = fs.linkSync; let replaced = false;
  const injected = t.mock.method(fs, "linkSync", (...args: Parameters<typeof fs.linkSync>) => {
    if (!replaced) {
      replaced = true; fs.renameSync(f.root, path.join(f.temporary, "original-root")); fs.mkdirSync(f.root, { mode: 0o700 });
      fs.mkdirSync(path.join(f.root, ".runtime-owner"), { mode: 0o700 }); fs.writeFileSync(path.join(f.root, ".runtime-owner", "owner.json"), "replacement owner");
    }
    original(...args);
  });
  const result = RuntimeMobileBuilds.initialize({ environment: f.environment }); injected.mock.restore();
  assert.equal(result.ready, false); assert.equal(fs.readFileSync(path.join(f.root, ".runtime-owner", "owner.json"), "utf8"), "replacement owner");
}));
