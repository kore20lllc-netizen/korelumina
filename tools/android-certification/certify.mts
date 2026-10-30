import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { Request } from 'express';
import { resolveRuntimeCallerFor } from '../../apps/lumina-runtime/src/routes/runtimeCaller.js';
import { takeRepositorySnapshot } from '../../apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.js';
import { analyzeMobileCompatibility } from '../../apps/lumina-runtime/src/mobile/analyzeMobileCompatibility.js';
import { validateMobilePackageSpecification } from '../../apps/lumina-runtime/src/mobile/validateMobilePackageSpecification.js';
import { MOBILE_PACKAGE_SPECIFICATION_VERSION } from '../../apps/lumina-runtime/src/mobile/MobilePackageSpecification.js';
import { RuntimeMobileBuilds } from '../../apps/lumina-runtime/src/mobile/RuntimeMobileBuilds.js';
import { AndroidArtifactStore, androidSha } from '../../apps/lumina-runtime/src/mobile/AndroidPackaging.js';
import { AndroidPackagingExecutor } from '../../apps/lumina-runtime/src/mobile/AndroidPackagingExecutor.js';
execFileSync(process.execPath, ['tools/android-certification/verify.mjs', '--execution']);
delete process.env.CERT_APPROVAL_ENVELOPE; delete process.env.CERT_APPROVAL_PUBLIC_KEY; delete process.env.GH_READ_TOKEN; delete process.env.CERT_PROVENANCE_B64;
assert.equal(process.platform, 'linux'); assert.equal(process.arch, 'x64');
assert(process.env.RUNNER_TEMP && path.isAbsolute(process.env.RUNNER_TEMP));
const temporary = fs.realpathSync(process.env.RUNNER_TEMP);
const privateRoot = path.join(temporary, 'klm-android-private');
const evidenceRoot = path.join(temporary, 'klm-android-evidence');
fs.mkdirSync(privateRoot, { mode: 0o700 }); fs.mkdirSync(evidenceRoot, { mode: 0o700 });
const dirs = Object.fromEntries(['project', 'store', 'staging', 'artifacts'].map(name => {
  const directory = path.join(privateRoot, name); fs.mkdirSync(directory, { mode: 0o700 }); return [name, directory];
}));
const toolchain = JSON.parse(fs.readFileSync('tools/android-certification/toolchain.json', 'utf8'));
for (const name of ['package.json', 'package-lock.json', 'index.html', 'main.js']) fs.copyFileSync(path.join('tools/android-certification/fixture', name), path.join(dirs.project!, name));
const snapshot = takeRepositorySnapshot(dirs.project!);
const report = analyzeMobileCompatibility(snapshot, { applicationRoot: '.' });
const projectId = 'klm-android-certification';
// A disposable internal-token identity resolved through the real Runtime resolver.
// No Supabase users, production registry records, role overrides or auth certification.
const token = randomBytes(32).toString('hex');
const headers: Record<string, string> = { 'x-korelumina-runtime-token': token, 'x-korelumina-user-id': 'klm-certification-owner', 'x-korelumina-role': 'pro' };
const identity = resolveRuntimeCallerFor({ header: (name: string) => headers[name], socket: { remoteAddress: '127.0.0.1' } } as unknown as Request, { NODE_ENV: 'production', KORELUMINA_RUNTIME_INTERNAL_TOKEN: token });
assert.equal(identity.source, 'internal-token');
const context = { projectId, repositoryRoot: dirs.project!, snapshot, metadata: { projectId, ownerId: 'klm-certification-owner', visibility: 'private' as const, createdAt: 1, updatedAt: 1 }, identity };
const specification = validateMobilePackageSpecification({ schemaVersion: MOBILE_PACKAGE_SPECIFICATION_VERSION, projectId, applicationRoot: '.', target: 'android', applicationName: 'KoreLumina Certification', applicationIdentifier: 'com.korelumina.certification', version: '1.0.0', buildNumber: 1, sourceSnapshotFingerprint: snapshot.fingerprint, compatibilityReportFingerprint: report.reportFingerprint, nativeCapabilities: [], permissions: [], build: { mode: 'debug', webAssetsDirectory: 'dist' }, artifact: { format: 'apk', signing: 'unsigned' } }, context);
const artifacts = new AndroidArtifactStore(dirs.artifacts!);
const initialized = RuntimeMobileBuilds.initialize({ environment: { NODE_ENV: 'production', KORELUMINA_MOBILE_BUILD_STORAGE_ROOT: dirs.store!, KORELUMINA_MOBILE_BUILD_STORAGE_MODE: 'exclusive-local' }, verifyArtifact: artifacts.verify });
assert(initialized.ready);
const service = initialized.service;
try {
  const record = service.create({ projectId, specificationFingerprint: specification.specificationFingerprint, operation: 'package', idempotencyKey: 'klm-001i-certification-v1', maxAttempts: 1 }, specification, context);
  const dockerExecutable = execFileSync('/usr/bin/which', ['docker'], { encoding: 'utf8' }).trim();
  const executor = new AndroidPackagingExecutor({ dockerExecutable, dockerSocket: '/var/run/docker.sock', image: toolchain.reviewedImage, capacitorVersion: toolchain.capacitorVersion, buildToolsVersion: toolchain.buildToolsVersion, stagingRoot: dirs.staging!, isolationPolicy: 'dedicated-linux-vm' }, artifacts);
  const result = await executor.execute(service, record.request.requestId, specification, context);
  fs.writeFileSync(path.join(evidenceRoot, 'result.json'), JSON.stringify({ ...result, toolchain, sourceSnapshotFingerprint: snapshot.fingerprint, specificationFingerprint: specification.specificationFingerprint, authenticationCertification: 'not-performed' }, null, 2));
  assert(result.ok, `Real packaging failed: ${result.reason}`);
  const completed = service.get(record.request.requestId, context), attempt = completed.attempts.at(-1)!;
  assert.equal(attempt.state, 'completed'); assert(attempt.artifact);
  const evidence = artifacts.verify(attempt.artifact.reference, { request: completed.request, attemptId: attempt.attemptId, specification });
  assert(evidence);
  const apk = path.join(dirs.artifacts!, evidence.reference.split(':')[1] + '.apk');
  assert.equal(fs.statSync(apk).size, evidence.bytes); assert.equal(androidSha(fs.readFileSync(apk)), evidence.sha256);
  assert.equal(takeRepositorySnapshot(dirs.project!).fingerprint, snapshot.fingerprint);
  fs.copyFileSync(apk, path.join(evidenceRoot, 'app-debug.apk'));
  fs.writeFileSync(path.join(evidenceRoot, 'provenance.json'), JSON.stringify({ artifact: evidence, sourceFiles: snapshot.files, specification, lifecycle: service.history(record.request.requestId, context), image: toolchain.reviewedImage }, null, 2));
} finally {
  assert.equal(service.close().reason, 'closed');
}
