import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { verifyPermit, decodeMeasurementEvidence, validateEnvironment, validateProvenance, validateNetwork, validateFixtureLock, sha256 } from './contracts.mjs';
import { resourcePreflight, runnerDiskCapacity } from './resource-preflight.mjs';
const root = fs.realpathSync(new URL('../../', import.meta.url).pathname);
const directory = path.join(root, 'tools/android-certification');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'source-manifest.json')));
assert.equal(manifest.schemaVersion, 'klm-certification-sources:v1');
for (const [file, expected] of Object.entries(manifest.files)) {
  assert(!file.startsWith('/') && !file.split('/').includes('..'));
  const target = path.join(root, file);
  assert.equal(fs.realpathSync(target), target, 'No symlinked source');
  assert.equal(hash(fs.readFileSync(target)), expected, `Source drift: ${file}`);
}
const allowedAssets = new Set([...Object.keys(manifest.files), 'tools/android-certification/source-manifest.json']);
function inspectAssets(directoryPath) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'No symlinked certification assets');
    const file = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) inspectAssets(file);
    else assert(allowedAssets.has(path.relative(root, file)), 'Unexpected certification asset');
  }
}
inspectAssets(directory);
const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'fixture/package.json')));
const lock = JSON.parse(fs.readFileSync(path.join(directory, 'fixture/package-lock.json')));
validateFixtureLock(pkg, lock);
const workflow = fs.readFileSync(path.join(root, '.github/workflows/android-certification.yml'), 'utf8');
assert(workflow.includes('  workflow_dispatch:') && !/^  (push|pull_request|schedule):/m.test(workflow));
assert(workflow.includes('contents: read') && workflow.includes('environment: android-certification'));
assert(!workflow.includes('docker pull') && !workflow.includes('npm ci') && !workflow.includes('systemctl'));
assert(!workflow.includes('setup-node'), 'Host provisioning is a separate governed phase');
for (const use of workflow.matchAll(/uses: ([^\s]+)/g)) assert(/@[a-f0-9]{40}$/.test(use[1]));
const toolchain = JSON.parse(fs.readFileSync(path.join(directory, 'toolchain.json')));
if (process.argv.includes('--execution')) {
  assert.equal(process.env.RUNNER_ENVIRONMENT, 'github-hosted');
  assert.equal(toolchain.nativeExecutionEnabled, true, 'Native execution remains disabled');
  assert.equal(process.versions.node, toolchain.node, 'Host Node must be preprovisioned exactly');
  assert.equal(execFileSync('npm', ['--version'], {encoding:'utf8'}).trim(),toolchain.npm);
  assert(typeof process.env.CERT_PROVENANCE_B64==='string' && process.env.CERT_PROVENANCE_B64.length<=1048576,'Protected provenance receipt missing');
  const provenanceBytes=Buffer.from(process.env.CERT_PROVENANCE_B64,'base64');
  const p=JSON.parse(provenanceBytes);
  const bindings={repository:process.env.GITHUB_REPOSITORY,commit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,manifestSha256:hash(fs.readFileSync(path.join(directory,'source-manifest.json'))),provenanceSha256:hash(provenanceBytes)};
  assert.equal(bindings.repository,'kore20lllc-netizen/korelumina');
  for (const value of Object.values(bindings)) assert(typeof value==='string' && value.length>0);
  verifyPermit(process.env.CERT_APPROVAL_ENVELOPE,process.env.CERT_APPROVAL_PUBLIC_KEY,bindings);
  // Server-side environment protection and a different human's recorded approval
  // are independently checked; a workflow input or repo flag cannot replace them.
  const api=async suffix => {
    const response=await fetch(`https://api.github.com/repos/${bindings.repository}/${suffix}`,{headers:{Authorization:`Bearer ${process.env.GH_READ_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(10000)});
    assert(response.ok,'Cannot verify GitHub approval boundary');return response.json();
  };
  validateEnvironment(await api('environments/android-certification'),await api(`actions/runs/${bindings.runId}/approvals`),bindings.runId,process.env.GITHUB_ACTOR);
  assert(typeof process.env.CERT_COMPONENT_MEASUREMENT_B64==='string' && process.env.CERT_COMPONENT_MEASUREMENT_B64.length<=87384,'Protected component measurement evidence missing');
  const measurementBytes=decodeMeasurementEvidence(process.env.CERT_COMPONENT_MEASUREMENT_B64);
  validateProvenance(p,toolchain,{fixtureLockSha256:hash(fs.readFileSync(path.join(directory,'fixture/package-lock.json'))),recipeSha256:hash(fs.readFileSync(path.join(directory,'Dockerfile')))},Date.now(),measurementBytes);
  const rules=execFileSync('sudo',['-n','nft','-j','list','ruleset'],{timeout:10000,maxBuffer:1048576});
  validateNetwork(p.network,{runId:bindings.runId,runAttempt:bindings.runAttempt,commit:bindings.commit},sha256(rules));
  resourcePreflight(p.resources,{image:p.image,fixtureLockSha256:p.fixtureLockSha256,adapterSha256:hash(fs.readFileSync(path.join(root,'apps/lumina-runtime/src/mobile/AndroidPackagingExecutor.ts')))},runnerDiskCapacity(process.env.RUNNER_TEMP));
  // Inspect only; never pull, install, relabel or restart a daemon here.
  const installed=JSON.parse(execFileSync('docker',['image','inspect',p.image],{timeout:10000,maxBuffer:1048576}))[0];
  assert.equal(installed.Os,'linux');assert.equal(installed.Architecture,'amd64');
  assert(installed.RepoDigests.includes(p.image),'Installed image digest mismatch');
  const changed=execFileSync('git',['diff','--name-only',manifest.baseCommit,'HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
  assert(changed.every(file=>allowedAssets.has(file)),'Unapproved source changes');
  assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:root,encoding:'utf8'}).trim(),'');
}
console.log(`PASS: ${Object.keys(manifest.files).length} source hashes; fixture closure and action pins`);
