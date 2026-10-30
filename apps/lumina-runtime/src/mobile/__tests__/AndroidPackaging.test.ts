import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { tmpdir } from "node:os";
import vm from "node:vm";
import test from "node:test";
import { takeRepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
import { analyzeMobileCompatibility } from "../analyzeMobileCompatibility.js";
import { MOBILE_PACKAGE_SPECIFICATION_VERSION, type MobilePackageValidationContext } from "../MobilePackageSpecification.js";
import { validateMobilePackageSpecification } from "../validateMobilePackageSpecification.js";
import { createMobileBuildRequest, MobileBuildContractError } from "../MobileBuildRequest.js";
import { RuntimeMobileBuilds } from "../RuntimeMobileBuilds.js";
import { AndroidPackagingError, ANDROID_CONFIG_SCRIPT, AndroidArtifactStore, androidSha, apkFromDockerTar, planAndroidPackaging, stageAndroidSource, verifyAndroidBadging } from "../AndroidPackaging.js";
import { AndroidPackagingExecutor, assertAndroidWorkerAuthority, androidBuildScript, androidContainerLimits, runBoundedAndroidProcess, validateAndroidExecutionConfiguration, type AndroidExecutionConfiguration } from "../AndroidPackagingExecutor.js";
async function isolated(run: (f: ReturnType<typeof fixture>) => void | Promise<void>, options: { angular?: boolean; lock?: boolean; camera?: boolean; release?: boolean; extra?: Record<string, string> } = {}) {
  const f = fixture(options); try { await run(f); } finally { fs.rmSync(f.temporary, { recursive: true, force: true }); assert.equal(fs.existsSync(f.temporary), false); }
}
function fixture(options: { angular?: boolean; lock?: boolean; camera?: boolean; release?: boolean; extra?: Record<string, string> } = {}) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "klm-android-")); const repository = path.join(temporary, "project"), staging = path.join(temporary, "staging"), artifactRoot = path.join(temporary, "artifacts");
  for (const root of [repository, staging, artifactRoot]) fs.mkdirSync(root, { mode: 0o700 });
  const dependencies = options.angular ? { "@angular/core": "20" } : { react: "18", vite: "5" };
  const contents: Record<string, string> = { "package.json": JSON.stringify({ dependencies, scripts: { build: "throw-must-not-execute-on-host" } }), "index.html": "<head></head>", "src/main.ts": "mustNeverExecuteOnHost();", ...(options.lock === false ? {} : { "package-lock.json": JSON.stringify({ lockfileVersion: 3, packages: { "": { dependencies } } }) }), ...(options.angular ? { "angular.json": JSON.stringify({ projects: { app: { projectType: "application" } } }) } : {}), ...options.extra };
  for (const [file, bytes] of Object.entries(contents)) { fs.mkdirSync(path.dirname(path.join(repository, file)), { recursive: true }); fs.writeFileSync(path.join(repository, file), bytes); }
  const snapshot = takeRepositorySnapshot(repository); const report = analyzeMobileCompatibility(snapshot, { applicationRoot: "." });
  const context: MobilePackageValidationContext = { projectId: "shop", repositoryRoot: repository, snapshot, metadata: { projectId: "shop", ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 }, identity: { source: "verified-token", caller: { userId: "alice", role: "pro", supportAccess: false, adminTools: false } } };
  const specification = validateMobilePackageSpecification({ schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId: "shop", applicationRoot: ".", target: "android", applicationName: "Shop", applicationIdentifier: "com.example.shop", version: "1.2.3", buildNumber: 7, sourceSnapshotFingerprint: snapshot.fingerprint, compatibilityReportFingerprint: report.reportFingerprint,
    nativeCapabilities: options.camera ? ["camera"] : [], permissions: options.camera ? [{ name: "android.permission.CAMERA", rationale: "Capture a photo only upon user request." }] : [], build: { mode: options.release ? "release" : "debug", webAssetsDirectory: "dist" }, artifact: { format: options.release ? "aab" : "apk", signing: options.release ? "required" : "unsigned" } }, context);
  const input = { projectId: "shop", specificationFingerprint: specification.specificationFingerprint, operation: "package", idempotencyKey: "android-one", maxAttempts: 1 };
  const request = createMobileBuildRequest(input, specification, context);
  const configuration: AndroidExecutionConfiguration = { dockerExecutable: process.execPath, dockerSocket: path.join(temporary, "engine.sock"), image: `approved/mobile@sha256:${"a".repeat(64)}`, capacitorVersion: "8.4.3", buildToolsVersion: "35.0.0", stagingRoot: staging, isolationPolicy: "dedicated-linux-vm" };
  return { temporary, repository, staging, artifactRoot, contents, context, specification, request, input, configuration };
}
function rejected(work: () => unknown, code: string) { assert.throws(work, error => (error instanceof AndroidPackagingError || error instanceof MobileBuildContractError) && error.code === code); }
const unitZip = Buffer.from([80, 75, 3, 4, 1, 2, 3, 4]); // ZIP-shaped transport fixture, NOT a built or installable APK.
function tar(bytes = unitZip, name = "app-debug.apk", type = "0") {
  const buffer = Buffer.alloc(512 + Math.ceil(bytes.length / 512) * 512 + 1024); const header = buffer.subarray(0, 512);
  header.write(name, 0); header.write(bytes.length.toString(8).padStart(11, "0") + "\0", 124); header.fill(32, 148, 156); header[156] = type.charCodeAt(0);
  const checksum = [...header].reduce((sum, value) => sum + value, 0); header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148); bytes.copy(buffer, 512); return buffer;
}

test("authorized candidate yields a real debug assemble task without claiming build readiness", async () => isolated(f => {
  const plan = planAndroidPackaging(f.specification, f.context); assert.equal(plan.task, "assembleDebug"); assert.equal(plan.executionBlocker, null); assert.equal(plan.sourceSnapshotFingerprint, f.context.snapshot.fingerprint); assert.ok(Object.isFrozen(plan));
}));
test("release AAB has an explicit task/output but is blocked on production signing policy", async () => isolated(f => {
  const plan = planAndroidPackaging(f.specification, f.context); assert.equal(plan.task, "bundleRelease"); assert.ok(plan.output.endsWith("app-release.aab")); assert.equal(plan.executionBlocker, "release_signing_unavailable");
}, { release: true }));
test("unsupported framework is rejected rather than falsely certified", async () => isolated(f => { rejected(() => planAndroidPackaging(f.specification, f.context), "unsupported_application"); }, { angular: true }));
test("an application without a local npm lockfile is unsupported", async () => isolated(f => { rejected(() => planAndroidPackaging(f.specification, f.context), "unsupported_application"); }, { lock: false }));
test("unreviewed native plugins and capabilities remain blocked", async () => isolated(f => { rejected(() => planAndroidPackaging(f.specification, f.context), "unsupported_application"); }, { camera: true }));
test("invalid source fingerprint and cross-project authority are rejected", async () => isolated(f => {
  rejected(() => planAndroidPackaging(f.specification, { ...f.context, snapshot: { ...f.context.snapshot, fingerprint: "c".repeat(64) } }), "invalid_specification");
  rejected(() => planAndroidPackaging(f.specification, { ...f.context, projectId: "theirs" }), "invalid_specification");
}));
for (const applicationRoot of ["../escape", "/absolute", "a\\b", "a//b"]) test(`unsafe application root ${applicationRoot} is rejected`, async () => isolated(f => {
  rejected(() => planAndroidPackaging(Object.freeze({ ...f.specification, applicationRoot }), f.context), "invalid_specification");
}));
test("source preparation copies hash-bound bytes and preserves the original repository", async () => isolated(f => {
  const staged = stageAndroidSource(f.context, f.specification, f.staging);
  try { for (const [file, bytes] of Object.entries(f.contents)) { assert.equal(fs.readFileSync(path.join(staged, "source", file), "utf8"), bytes); assert.equal(fs.readFileSync(path.join(f.repository, file), "utf8"), bytes); } }
  finally { fs.rmSync(staged, { recursive: true, force: true }); }
}));
test("changed source bytes fail closed and temporary workspace is removed", async () => isolated(f => {
  fs.writeFileSync(path.join(f.repository, "src/main.ts"), "modified"); rejected(() => stageAndroidSource(f.context, f.specification, f.staging), "invalid_source"); assert.deepEqual(fs.readdirSync(f.staging), []);
}));
test("source symlinks cannot substitute another project's file", async () => isolated(f => {
  const file = path.join(f.repository, "src/main.ts"); fs.unlinkSync(file); fs.symlinkSync(path.join(f.repository, "index.html"), file);
  rejected(() => stageAndroidSource(f.context, f.specification, f.staging), "invalid_source");
}));
for (const file of [".env", ".npmrc", "private.key"]) test(`sensitive source ${file} is never staged`, async () => isolated(f => { rejected(() => stageAndroidSource(f.context, f.specification, f.staging), "source_sensitive_file"); }, { extra: { [file]: "DO_NOT_COPY_SECRET" } }));
test("configuration edits apply validated version and permissions to the generated template", async () => isolated(f => {
  const virtual: Record<string, string> = { "/input/plan.json": JSON.stringify(planAndroidPackaging(f.specification, f.context)), "/work/native/android/app/build.gradle": 'defaultConfig { versionCode 1\nversionName "1.0" }', "/work/native/android/app/src/main/AndroidManifest.xml": '<manifest xmlns:android="android"><uses-permission android:name="android.permission.INTERNET" /><application /></manifest>' };
  vm.runInNewContext(ANDROID_CONFIG_SCRIPT, { require: (module: string) => { assert.equal(module, "node:fs"); return { readFileSync: (file: string) => virtual[file], writeFileSync: (file: string, bytes: string) => { virtual[file] = bytes; } }; } });
  assert.match(virtual["/work/native/android/app/build.gradle"], /versionCode 7/); assert.match(virtual["/work/native/android/app/build.gradle"], /versionName "1.2.3"/); assert.ok(!virtual["/work/native/android/app/src/main/AndroidManifest.xml"].includes("INTERNET"));
}));
test("build commands are real offline npm, Capacitor and Gradle invocations inside resource limits", () => {
  const script = androidBuildScript("8.4.3"); for (const command of ["npm ci --offline --ignore-scripts", "npm run build", "cap add android", "cap sync android", "gradlew assembleDebug --offline"]) assert.ok(script.includes(command));
  const flags = androidContainerLimits(); for (const flag of ["--network=none", "--read-only", "--pull=never", "--cap-drop=ALL", "--pids-limit=256", "--memory=3g", "--restart=no"]) assert.ok(flags.includes(flag));
  assert.ok(!flags.some(flag => flag.includes("docker.sock"))); rejected(() => androidBuildScript("latest;evil"), "invalid_configuration");
});
for (const patch of [{ image: "mobile:latest" }, { capacitorVersion: "latest" }, { dockerExecutable: "docker" }, { isolationPolicy: "host" }]) test(`unsafe execution configuration ${JSON.stringify(patch)} is rejected`, async () => isolated(f => {
  rejected(() => validateAndroidExecutionConfiguration({ ...f.configuration, ...patch } as AndroidExecutionConfiguration), "invalid_configuration");
}));
test("configuration is detached and immutable after validation", async () => isolated(f => {
  const mutable = { ...f.configuration }; const executor = new AndroidPackagingExecutor(mutable, new AndroidArtifactStore(f.artifactRoot)); mutable.image = "untrusted:latest";
  assert.equal(executor.configuration.image, f.configuration.image); assert.ok(Object.isFrozen(executor.configuration));
}));
test("missing secure execution environment blocks actual execution readiness", async () => isolated(async f => {
  fs.writeFileSync(f.configuration.dockerSocket, "not a socket"); const executor = new AndroidPackagingExecutor(f.configuration, new AndroidArtifactStore(f.artifactRoot));
  assert.deepEqual(await executor.preflight(), { ready: false, reason: "isolation_unavailable" }); assert.deepEqual(fs.readdirSync(f.staging), []);
}));
test("missing Android image fails closed without downloads or build execution", async () => isolated(async f => {
  const server = net.createServer(); await new Promise<void>(resolve => server.listen(f.configuration.dockerSocket, resolve));
  const executable = path.join(f.temporary, "trusted-test-docker");
  fs.writeFileSync(executable, `#!${process.execPath}\nconst a=process.argv[2];if(a==='info')console.log(JSON.stringify({OSType:'linux',CgroupVersion:'2',MemoryLimit:true,SwapLimit:true,CpuCfsQuota:true,PidsLimit:true,SecurityOptions:['name=seccomp'],Labels:['korelumina.mobile.execution=dedicated']}));else if(a==='ps'){}else process.exit(1);`, { mode: 0o700 });
  try { const executor = new AndroidPackagingExecutor({ ...f.configuration, dockerExecutable: executable }, new AndroidArtifactStore(f.artifactRoot)); assert.deepEqual(await executor.preflight(), { ready: false, reason: "toolchain_unavailable" }); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}));
test("process failures return fixed diagnostics without exposing secret output", async () => {
  await assert.rejects(runBoundedAndroidProcess(process.execPath, ["-e", 'process.stderr.write("secret-value");process.exit(7)'], {}, { timeoutMs: 2000, outputBytes: 1024 }), error => error instanceof AndroidPackagingError && error.code === "process_failed" && !error.message.includes("secret"));
});
test("process timeout is bounded", async () => {
  await assert.rejects(runBoundedAndroidProcess(process.execPath, ["-e", "setInterval(()=>{},1000)"], {}, { timeoutMs: 100, outputBytes: 1024 }), error => error instanceof AndroidPackagingError && error.code === "timeout");
});
test("active cancellation terminates the trusted process handle", async () => {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 100);
  try { await assert.rejects(runBoundedAndroidProcess(process.execPath, ["-e", "setInterval(()=>{},1000)"], {}, { timeoutMs: 2000, outputBytes: 1024, signal: controller.signal }), error => error instanceof AndroidPackagingError && error.code === "cancelled"); } finally { clearTimeout(timer); }
});
test("raw log volume is bounded", async () => {
  await assert.rejects(runBoundedAndroidProcess(process.execPath, ["-e", 'process.stdout.write("x".repeat(20000))'], {}, { timeoutMs: 2000, outputBytes: 1024 }), error => error instanceof AndroidPackagingError && error.code === "process_failed");
});
test("zero process exit without an artifact is never success", async () => {
  const output = await runBoundedAndroidProcess(process.execPath, ["-e", "process.exit(0)"], {}, { timeoutMs: 2000, outputBytes: 1024 }); rejected(() => apkFromDockerTar(output), "artifact_missing");
});
test("artifact transport accepts only one bounded regular APK-shaped member", () => {
  assert.deepEqual(apkFromDockerTar(tar()), unitZip);
  for (const input of [tar(unitZip, "../escape.apk"), tar(unitZip, "app-debug.apk", "2"), tar(Buffer.from("not ZIP")), Buffer.from("garbage")]) rejected(() => apkFromDockerTar(input), "artifact_invalid");
  const extra = tar(); extra[extra.length - 1] = 1; rejected(() => apkFromDockerTar(extra), "artifact_invalid");
});
test("independent badging must match application identity, version and every requested permission", async () => isolated(f => {
  const plan = planAndroidPackaging(f.specification, f.context); const correct = "package: name='com.example.shop' versionCode='7' versionName='1.2.3'"; verifyAndroidBadging(correct, plan);
  for (const bad of [correct.replace("shop", "theirs"), correct.replace("'7'", "'8'"), correct + "\nuses-permission: name='android.permission.READ_SMS'"]) rejected(() => verifyAndroidBadging(bad, plan), "artifact_invalid");
}));
test("artifact storage checksum/provenance verification is scoped and detects tampering (unit bytes only)", async () => isolated(f => {
  const store = new AndroidArtifactStore(f.artifactRoot); const artifact = store.persist(unitZip, f.request, "attempt-unit", f.specification, 1);
  const expected = { request: f.request, attemptId: "attempt-unit", specification: f.specification };
  assert.equal(artifact.sha256, androidSha(unitZip)); assert.equal(store.verify(artifact.reference, expected)!.requestId, f.request.requestId);
  assert.equal(store.verify(artifact.reference, { ...expected, attemptId: "other" }), null);
  assert.equal(store.verify(artifact.reference, { ...expected, request: { ...f.request, projectId: "theirs" } }), null);
  fs.writeFileSync(path.join(f.artifactRoot, `${artifact.reference.split(":")[1]}.apk`), Buffer.from([80, 75, 3, 4, 99])); assert.equal(store.verify(artifact.reference, expected), null);
}));
test("closed durable Runtime prevents executor admission before any tool starts", async () => isolated(async f => {
  const root = path.join(f.temporary, "runtime"); fs.mkdirSync(root, { mode: 0o700 });
  const initialized = RuntimeMobileBuilds.initialize({ environment: { KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: root, KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "exclusive-local" } });
  assert.equal(initialized.ready, true); if (!initialized.ready) return; initialized.service.close();
  const executor = new AndroidPackagingExecutor(f.configuration, new AndroidArtifactStore(f.artifactRoot));
  await assert.rejects(executor.execute(initialized.service, f.request.requestId, f.specification, f.context), error => error instanceof AndroidPackagingError && error.code === "isolation_unavailable");
}));


test("Android publication rejects expired and stale worker fencing before accepting results", async () => isolated(f => {
  const root = path.join(f.temporary, "runtime"); fs.mkdirSync(root, { mode: 0o700 }); let now = 1000000;
  const initialized = RuntimeMobileBuilds.initialize({ environment: { KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: root, KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "exclusive-local" }, now: () => now });
  assert.equal(initialized.ready, true); if (!initialized.ready) return; const service = initialized.service;
  try {
    let record = service.create({ ...f.input, maxAttempts: 2 }, f.specification, f.context);
    record = service.claim(record.request.requestId, record.sequence, record.attempts.at(-1)!.attemptId, "android:unit-worker", f.context);
    const attempt = record.attempts.at(-1)!, proof = { workerId: attempt.workerLease!.workerId, fencingToken: attempt.workerLease!.fencingToken };
    assertAndroidWorkerAuthority(record, attempt.attemptId, proof, now);
    rejected(() => assertAndroidWorkerAuthority(record, attempt.attemptId, { ...proof, fencingToken: 0 }, now), "ownership_lost");
    now = attempt.workerLease!.expiresAt; rejected(() => assertAndroidWorkerAuthority(record, attempt.attemptId, proof, now), "ownership_lost");
    record = service.recover(record.request.requestId, record.sequence, attempt.attemptId, f.context); record = service.retry(record.request.requestId, record.sequence, f.context);
    record = service.claim(record.request.requestId, record.sequence, record.attempts.at(-1)!.attemptId, "android:new-worker", f.context);
    rejected(() => assertAndroidWorkerAuthority(record, attempt.attemptId, proof, now), "ownership_lost");
    record = service.transition(record.request.requestId, { expectedSequence: record.sequence, attemptId: record.attempts.at(-1)!.attemptId, type: "cancel" }, f.context);
    rejected(() => assertAndroidWorkerAuthority(record, record.attempts.at(-1)!.attemptId, { workerId: record.attempts.at(-1)!.workerLease!.workerId, fencingToken: record.attempts.at(-1)!.workerLease!.fencingToken }, now), "cancelled");
  } finally { service.close(); }
}));


test("view-only project access cannot trigger staging or toolchain operations", async () => isolated(async f => {
  const root = path.join(f.temporary, "runtime"); fs.mkdirSync(root, { mode: 0o700 });
  const initialized = RuntimeMobileBuilds.initialize({ environment: { KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: root, KORELUMINA_MOBILE_BUILD_STORAGE_MODE: "exclusive-local" } });
  assert.equal(initialized.ready, true); if (!initialized.ready) return;
  try {
    initialized.service.create(f.input, f.specification, f.context);
    const teammate: MobilePackageValidationContext = { ...f.context, metadata: { ...f.context.metadata!, teamId: "team" }, identity: { source: "internal-token", caller: { userId: "bob", teamId: "team", role: "pro", supportAccess: false, adminTools: false } } };
    const executor = new AndroidPackagingExecutor(f.configuration, new AndroidArtifactStore(f.artifactRoot));
    await assert.rejects(executor.execute(initialized.service, f.request.requestId, f.specification, teammate), error => error instanceof MobileBuildContractError && error.code === "access_denied");
    assert.deepEqual(fs.readdirSync(f.staging), []);
  } finally { initialized.service.close(); }
}));
