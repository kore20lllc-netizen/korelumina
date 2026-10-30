import assert from 'node:assert/strict';
import { createHash, createPublicKey, verify } from 'node:crypto';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const LIMITS = Object.freeze({ memoryBytes: 3 * 1024 ** 3, workBytes: 2 * 1024 ** 3, tmpBytes: 256 * 1024 ** 2, cpus: 2, pids: 256, buildMs: 600000 });
const hash = value => assert(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), 'Invalid SHA-256');
const image = value => assert(typeof value === 'string' && /^[a-z0-9][a-z0-9./_-]*@sha256:[a-f0-9]{64}$/.test(value), 'Unpinned image');
const same = (a,b,message) => assert.deepEqual(a,b,message);
export function verifyPermit(encoded, keyPem, expected, now = Date.now()) {
  assert(typeof encoded === 'string' && encoded.length <= 65536 && typeof keyPem === 'string', 'Independent approval unavailable');
  const envelope = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  assert(typeof envelope.payload === 'string' && typeof envelope.signature === 'string');
  const key = createPublicKey(keyPem); assert.equal(key.asymmetricKeyType, 'ed25519');
  assert(verify(null, Buffer.from(envelope.payload), key, Buffer.from(envelope.signature, 'base64')), 'Invalid Founder signature');
  const p = JSON.parse(envelope.payload);
  assert.equal(p.schemaVersion, 'klm-execution-permit:v1');
  assert.equal(p.scope, 'one-debug-apk');
  for (const [name,value] of Object.entries(expected)) same(p[name], value, `Permit binding mismatch: ${name}`);
  assert(Number.isSafeInteger(p.issuedAt) && Number.isSafeInteger(p.expiresAt));
  assert(p.issuedAt <= now && now < p.expiresAt && p.expiresAt - p.issuedAt <= 3600000, 'Expired/invalid permit');
  same(p.limits, LIMITS, 'Resource limit amendment is not authorized');
  return p;
}
export function validateEnvironment(environment, approvals, runId, actor) {
  assert.equal(environment.name, 'android-certification');
  const reviewers = environment.protection_rules?.find(r => r.type === 'required_reviewers');
  assert(reviewers?.prevent_self_review === true && reviewers.reviewers?.length > 0, 'Independent environment reviewers required');
  assert(environment.deployment_branch_policy, 'Deployment branch policy required');
  const allowed = new Set(reviewers.reviewers.filter(r => r.type === 'User').map(r => String(r.reviewer.id)));
  assert(allowed.size > 0, 'Explicit reviewer identities required');
  assert(approvals.some(a => a.state === 'approved' && a.environments?.some(e => e.name === environment.name) && a.user?.login !== actor && allowed.has(String(a.user?.id))), 'Independent approval history unavailable');
  assert(/^\d+$/.test(runId));
}
export function validateProvenance(p, t, expected, now = Date.now(), measurementBytes) {
  assert.equal(p.schemaVersion, 'klm-android-provenance:v2');
  image(p.image); image(p.baseImage);
  same(p.image, t.reviewedImage); same(p.baseImage, t.baseImage);
  same(p.platform, 'linux/amd64');
  same(p.components, { node:t.node, npm:t.npm, jdk:t.jdkBuild, capacitor:t.capacitorVersion, gradle:t.gradle, agp:t.androidGradlePlugin, buildTools:t.buildToolsVersion, compileSdk:t.compileSdk, platformRevision:t.sdkPlatformRevision, commandLineTools:t.commandLineTools.revision });
  for (const [name,value] of Object.entries(expected)) { hash(p[name]); same(p[name],value, `Provenance mismatch: ${name}`); }
  same(p.nodeArchiveSha256,t.nodeLinuxX64Sha256); same(p.gradleDistributionSha256,t.gradleDistributionSha256);
  same(p.commandLineArchivePublisherSha1,t.commandLineTools.publisherSha1); hash(p.commandLineArchiveSha256);
  assert.equal(p.sdkLicense.id, 'android-sdk-license'); hash(p.sdkLicense.textSha256);
  assert(p.sdkLicense.approver && Number.isSafeInteger(p.sdkLicense.approvedAt) && p.sdkLicense.approvedAt>0 && p.sdkLicense.approvedAt<=now && p.sdkLicense.acceptanceEvidenceSha256); hash(p.sdkLicense.acceptanceEvidenceSha256);
  const d = p.dependencies;
  for (const name of ['nativeReplayManifestSha256','nativeWrapperLockSha256','npmCacheManifestSha256','mavenVerificationMetadataSha256','gradleCacheManifestSha256','resolvedClosureSha256']) hash(d[name]);
  assert.equal(d.closureComplete, true); assert.equal(d.offlineVerified, true);
  assert.equal(d.npmIntegrity, 'sha512'); assert.equal(d.mavenVerification, 'strict-sha256');
  assert(d.reviewedAt <= now && now - d.reviewedAt <= 86400000, 'Dependency review is stale');
  same(d.unresolvedAdvisories, []);
  same(p.actualComponents, p.components, 'Actual image tool measurements differ');
  verifyComponentMeasurement(p, measurementBytes);
  return p;
}
/** Bytes come only from the independently protected evidence channel. A signature
 * binds the provenance fingerprint; this independently binds the actual bytes. */
export function decodeMeasurementEvidence(encoded) {
  assert(typeof encoded==='string' && encoded.length>0 && encoded.length<=87384 && encoded.length%4===0 && /^[A-Za-z0-9+/]*={0,2}$/.test(encoded),'Malformed protected measurement encoding');
  const bytes=Buffer.from(encoded,'base64');
  assert.equal(bytes.toString('base64'),encoded,'Noncanonical measurement encoding');
  return bytes;
}
export function verifyComponentMeasurement(provenance, bytes) {
  assert(Buffer.isBuffer(bytes) && bytes.length>0 && bytes.length<=65536,'Measurement evidence missing or oversized');
  hash(provenance.componentMeasurementSha256);
  same(sha256(bytes),provenance.componentMeasurementSha256,'Component measurement checksum mismatch');
  const decoded=JSON.parse(bytes.toString('utf8'));
  assert(decoded && typeof decoded==='object' && !Array.isArray(decoded),'Malformed component measurement');
  same(decoded,provenance.components,'Measurement bytes do not match reviewed components');
  same(decoded,provenance.actualComponents,'Measurement bytes do not match actual components');
  return decoded;
}
export function validateResources(r, expected, now = Date.now()) {
  assert.equal(r.schemaVersion, 'klm-resource-measurement:v1');
  for (const [key,value] of Object.entries(expected)) same(r[key],value, `Resource measurement mismatch: ${key}`);
  assert.equal(r.method,'instrumented-offline-packaging'); assert.equal(r.complete,true);
  assert(r.measuredAt <= now && now-r.measuredAt <= 7*86400000, 'Resource measurement missing/stale');
  hash(r.samplesSha256); same(r.limits,LIMITS);
  for (const [key,limit] of [['memoryPeakBytes',LIMITS.memoryBytes],['workPeakBytes',LIMITS.workBytes],['tmpPeakBytes',LIMITS.tmpBytes]]) assert(Number.isSafeInteger(r[key]) && r[key]>0 && r[key]<limit, `Insufficient/unmeasured ${key}`);
}
export function validateNetwork(n, expected, liveRulesSha256) {
  assert.equal(n.schemaVersion,'klm-network-enforcement:v1');
  for (const [key,value] of Object.entries(expected)) same(n[key],value, `Network evidence mismatch: ${key}`);
  assert.equal(n.mode,'preprovisioned-control-plane-only');
  hash(n.rulesSha256); same(n.rulesSha256,liveRulesSha256, 'Live firewall drift');
  same(n.deniedProbes,['metadata','private-network','arbitrary-https','container-egress']);
  assert.equal(n.provisioningDisabled,true); hash(n.probeEvidenceSha256);
}
export function validateFixtureLock(pkg,lock) {
  same(lock.lockfileVersion,3); same(lock.packages[''].devDependencies,pkg.devDependencies);
  same(lock.packages[''].engines,pkg.engines);
  for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies})) {
    assert(/^\d+\.\d+\.\d+$/.test(version),'Direct fixture dependencies must be exact');
    same(lock.packages['node_modules/'+name]?.version,version,'Direct dependency lock mismatch');
  }
  for (const [name,value] of Object.entries(lock.packages)) {
    if (!name) continue;
    assert(!value.link && /^https:\/\/registry\.npmjs\.org\//.test(value.resolved));
    assert(/^sha512-[A-Za-z0-9+/]+=*$/.test(value.integrity));
    for (const dependency of Object.keys({...value.dependencies,...value.optionalDependencies})) {
      let parent=name, found=false;
      while (true) {
        if (lock.packages[parent+'/node_modules/'+dependency]) {found=true;break;}
        if (parent.includes('/node_modules/')) parent=parent.slice(0,parent.lastIndexOf('/node_modules/'));
        else if (parent) parent=''; else break;
      }
      assert(found || lock.packages['node_modules/'+dependency], `Incomplete lock: ${dependency}`);
    }
  }
}
