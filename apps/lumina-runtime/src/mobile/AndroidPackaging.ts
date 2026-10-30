import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type { MobilePackageSpecification, MobilePackageValidationContext } from "./MobilePackageSpecification.js";
import { revalidateMobileBuildSpecification, freezeMobileBuildValue, mobileBuildHash, type MobileArtifactEvidence, type MobileArtifactVerifier, type MobileBuildRequest } from "./MobileBuildRequest.js";
export type AndroidFailure = "invalid_source" | "source_sensitive_file" | "unsupported_application" | "invalid_configuration" | "toolchain_unavailable" | "isolation_unavailable" | "process_failed" | "timeout" | "cancelled" | "ownership_lost" | "artifact_missing" | "artifact_invalid" | "storage_unavailable" | "release_signing_unavailable";
export class AndroidPackagingError extends Error { constructor(readonly code: AndroidFailure) { super(code); this.name = "AndroidPackagingError"; } }
export const denyAndroid = (code: AndroidFailure): never => { throw new AndroidPackagingError(code); };
export const ANDROID_LIMITS = Object.freeze({ files: 10000, fileBytes: 8_000_000, sourceBytes: 100_000_000, artifactBytes: 100_000_000, processMs: 600000 });
export const androidSha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
export interface AndroidPlan {
  readonly projectId: string; readonly applicationRoot: string; readonly applicationIdentifier: string; readonly applicationName: string;
  readonly version: string; readonly buildNumber: number; readonly webAssetsDirectory: string; readonly permissions: readonly string[];
  readonly sourceSnapshotFingerprint: string; readonly specificationFingerprint: string; readonly task: "assembleDebug" | "bundleRelease";
  readonly output: string; readonly executionBlocker: "release_signing_unavailable" | null;
}
export function planAndroidPackaging(specification: MobilePackageSpecification, context: MobilePackageValidationContext): AndroidPlan {
  const spec = revalidateMobileBuildSpecification(specification, context);
  if (spec.target !== "android" || spec.adapter !== "capacitor" || !["react", "vite", "vue", "svelte"].includes(spec.framework) || spec.nativeCapabilities.some(cap => cap !== "network")) return denyAndroid("unsupported_application");
  const prefix = spec.applicationRoot === "." ? "" : `${spec.applicationRoot}/`;
  try {
    const pkg = JSON.parse(context.snapshot.read(`${prefix}package.json`)!); const lock = JSON.parse(context.snapshot.read(`${prefix}package-lock.json`)!);
    if (!pkg || !lock || ![2, 3].includes(lock.lockfileVersion) || pkg.workspaces || Object.values(pkg.dependencies ?? {}).some(value => typeof value === "string" && /^(workspace:|file:|link:)/.test(value))) return denyAndroid("unsupported_application");
    if ([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].some(name => name.startsWith("@capacitor/") || name.startsWith("cordova-"))) return denyAndroid("unsupported_application");
  } catch { return denyAndroid("unsupported_application"); }
  const release = spec.build.mode === "release";
  if (release ? spec.artifact.format !== "aab" : spec.artifact.format !== "apk" || spec.artifact.signing !== "unsigned") return denyAndroid("unsupported_application");
  return freezeMobileBuildValue({ projectId: spec.projectId, applicationRoot: spec.applicationRoot, applicationIdentifier: spec.applicationIdentifier, applicationName: spec.applicationName,
    version: spec.version, buildNumber: spec.buildNumber as number, webAssetsDirectory: spec.build.webAssetsDirectory, permissions: spec.permissions.map(p => p.name), sourceSnapshotFingerprint: spec.sourceSnapshotFingerprint,
    specificationFingerprint: spec.specificationFingerprint, task: release ? "bundleRelease" : "assembleDebug", output: release ? "android/app/build/outputs/bundle/release/app-release.aab" : "android/app/build/outputs/apk/debug/app-debug.apk", executionBlocker: release ? "release_signing_unavailable" : null });
}
export function privateAndroidDirectory(root: string): void {
  try { const stat = fs.lstatSync(root); if (!path.isAbsolute(root) || root !== fs.realpathSync(root) || !stat.isDirectory() || (stat.mode & 0o077) || (process.getuid && stat.uid !== process.getuid()) || /[,\x00-\x1f]/.test(root)) return denyAndroid("invalid_configuration"); }
  catch (error) { if (error instanceof AndroidPackagingError) throw error; return denyAndroid("storage_unavailable"); }
}
/** Copies only listed, hash-bound bytes. No host project code/configuration execution. */
export function stageAndroidSource(context: MobilePackageValidationContext, specification: MobilePackageSpecification, parent: string): string {
  planAndroidPackaging(specification, context); privateAndroidDirectory(parent);
  try { if (context.repositoryRoot !== fs.realpathSync(context.repositoryRoot)) return denyAndroid("invalid_source"); } catch { return denyAndroid("invalid_source"); }
  const files = context.snapshot.files.filter(file => !file.ignored); if (files.length > ANDROID_LIMITS.files) return denyAndroid("invalid_source");
  const root = fs.mkdtempSync(path.join(parent, "android-source-")); let total = 0;
  try {
    for (const file of files) {
      if (/(^|\/)(?:\.env(?:\..*)?|\.npmrc|\.yarnrc.*|\.netrc|\.git-credentials|id_rsa|id_ed25519)$|\.(?:pem|key)$/i.test(file.path)) return denyAndroid("source_sensitive_file");
      const source = path.join(context.repositoryRoot, file.path);
      if (fs.realpathSync(source) !== source || file.bytes > ANDROID_LIMITS.fileBytes || (total += file.bytes) > ANDROID_LIMITS.sourceBytes) return denyAndroid("invalid_source");
      const fd = fs.openSync(source, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW); const bytes = Buffer.alloc(file.bytes + 1); let length = 0;
      try { const stat = fs.fstatSync(fd); if (!stat.isFile() || stat.size !== file.bytes) return denyAndroid("invalid_source");
        while (length < bytes.length) { const read = fs.readSync(fd, bytes, length, bytes.length - length, null); if (!read) break; length += read; }
      } finally { fs.closeSync(fd); }
      if (length !== file.bytes || androidSha(bytes.subarray(0, length)) !== file.sha256) return denyAndroid("invalid_source");
      const destination = path.join(root, "source", file.path); fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 }); fs.writeFileSync(destination, bytes.subarray(0, length), { flag: "wx", mode: 0o600 });
    }
    return root;
  } catch (error) { fs.rmSync(root, { recursive: true, force: true }); if (error instanceof AndroidPackagingError) throw error; return denyAndroid("invalid_source"); }
}
/** Template edits are executed only inside the isolated build container. */
export const ANDROID_CONFIG_SCRIPT = String.raw`
const fs=require('node:fs');const p=JSON.parse(fs.readFileSync('/input/plan.json','utf8'));
const file='/work/native/android/app/build.gradle';let g=fs.readFileSync(file,'utf8');
for(const [pattern,value] of [[/versionCode\s+\d+/g,'versionCode '+p.buildNumber],[/versionName\s+"[^"\r\n]*"/g,'versionName '+JSON.stringify(p.version)]]){if((g.match(pattern)||[]).length!==1)throw Error('unsupported-template');g=g.replace(pattern,value)}fs.writeFileSync(file,g);
const manifest='/work/native/android/app/src/main/AndroidManifest.xml';let xml=fs.readFileSync(manifest,'utf8');if(xml.includes('<!DOCTYPE')||!xml.includes('<manifest')||!xml.includes('<application'))throw Error('unsupported-template');
xml=xml.replace(/<uses-permission(?:-sdk-23)?\b[^>]*\/>/g,'');xml=xml.replace(/(<manifest\b[^>]*>)/,'$1\n'+p.permissions.map(name=>'<uses-permission android:name="'+name+'" />').join('\n'));fs.writeFileSync(manifest,xml);
`;
/** No archive extraction on the host. Only one regular app-debug.apk is accepted. */
export function apkFromDockerTar(tar: Buffer): Buffer {
  if (tar.length === 0) return denyAndroid("artifact_missing");
  if (tar.length > ANDROID_LIMITS.artifactBytes + 4096 || tar.length < 1024) return denyAndroid("artifact_invalid");
  const header = tar.subarray(0, 512), name = header.subarray(0, 100).toString().replace(/\0.*$/, ""), type = String.fromCharCode(header[156]);
  const digits = header.subarray(124, 136).toString().replace(/\0/g, "").trim();
  if (!/^[0-7]+$/.test(digits) || !["0", "\0"].includes(type) || name !== "app-debug.apk") return denyAndroid("artifact_invalid");
  const size = parseInt(digits, 8), end = 512 + Math.ceil(size / 512) * 512;
  const checksum = parseInt(header.subarray(148, 156).toString().replace(/\0/g, "").trim(), 8);
  const sum = [...header].reduce((sum, value, index) => sum + (index >= 148 && index < 156 ? 32 : value), 0);
  if (sum !== checksum || size < 4 || size > ANDROID_LIMITS.artifactBytes || tar.length < end + 1024 || tar.subarray(end).some(value => value !== 0)) return denyAndroid("artifact_invalid");
  const apk = Buffer.from(tar.subarray(512, 512 + size)); if (!apk.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))) return denyAndroid("artifact_invalid"); return apk;
}
export function verifyAndroidBadging(output: string, plan: AndroidPlan): void {
  const pkg = output.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']*)'/m);
  const permissions = [...output.matchAll(/^uses-permission(?:-sdk-\d+)?: name='([^']+)'/gm)].map(match => match[1]).sort();
  if (!pkg || pkg[1] !== plan.applicationIdentifier || pkg[2] !== String(plan.buildNumber) || pkg[3] !== plan.version || JSON.stringify(permissions) !== JSON.stringify([...plan.permissions].sort())) return denyAndroid("artifact_invalid");
}
/** Runtime-private artifact storage; persist is called only after independent tool verification. */
export class AndroidArtifactStore {
  constructor(readonly root: string) { privateAndroidDirectory(root); Object.freeze(this); }
  persist(bytes: Buffer, request: MobileBuildRequest, attemptId: string, specification: MobilePackageSpecification, fencingToken: number): MobileArtifactEvidence {
    if (bytes.length < 4 || bytes.length > ANDROID_LIMITS.artifactBytes || !bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))) return denyAndroid("artifact_invalid");
    const sha256 = androidSha(bytes), reference = `android-artifact:${mobileBuildHash({ requestId: request.requestId, attemptId, fencingToken, sha256 })}`;
    const evidence: MobileArtifactEvidence = { reference, requestId: request.requestId, attemptId, projectId: request.projectId, target: "android", format: "apk", applicationIdentifier: specification.applicationIdentifier, version: specification.version, buildNumber: specification.buildNumber, sourceSnapshotFingerprint: request.sourceSnapshotFingerprint, specificationFingerprint: specification.specificationFingerprint, sha256, bytes: bytes.length, verification: "verified", signing: "unsigned" };
    // Existing 'unsigned' assurance means no production signing; debug signatures are independently checked.
    this.#publish(path.join(this.root, `${reference.split(":")[1]}.apk`), bytes); this.#publish(path.join(this.root, `${reference.split(":")[1]}.json`), Buffer.from(JSON.stringify(evidence)));
    return freezeMobileBuildValue(evidence);
  }
  #publish(file: string, bytes: Buffer): void {
    privateAndroidDirectory(this.root); const temporary = path.join(this.root, `${randomUUID()}.tmp`); const fd = fs.openSync(temporary, "wx", 0o600);
    try { try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      try { fs.linkSync(temporary, file); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST" || !fs.readFileSync(file).equals(bytes)) throw error; }
      const directory = fs.openSync(this.root, fs.constants.O_RDONLY); try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
    } finally { fs.unlinkSync(temporary); }
  }
  readonly verify: MobileArtifactVerifier = (reference, expected) => {
    if (!/^android-artifact:[a-f0-9]{64}$/.test(reference)) return null;
    try {
      privateAndroidDirectory(this.root); const name = reference.split(":")[1];
      const read = (extension: string, limit: number) => { const fd = fs.openSync(path.join(this.root, `${name}.${extension}`), fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW); try { const stat = fs.fstatSync(fd); if (!stat.isFile() || stat.size > limit) throw Error(); return fs.readFileSync(fd); } finally { fs.closeSync(fd); } };
      const evidence = JSON.parse(read("json", 8192).toString()) as MobileArtifactEvidence, bytes = read("apk", ANDROID_LIMITS.artifactBytes);
      if (evidence.reference !== reference || evidence.requestId !== expected.request.requestId || evidence.attemptId !== expected.attemptId || evidence.projectId !== expected.request.projectId || evidence.specificationFingerprint !== expected.specification.specificationFingerprint || evidence.sourceSnapshotFingerprint !== expected.request.sourceSnapshotFingerprint || evidence.bytes !== bytes.length || evidence.sha256 !== androidSha(bytes) || bytes.length < 4 || !bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))) return null;
      return freezeMobileBuildValue(evidence);
    } catch { return null; }
  };
}
