import fs from "node:fs";
import { ANDROID_NATIVE_REPLAY_SCRIPT, ANDROID_GRADLE_LOCK_POLICY } from "./AndroidNativeDependencyReplay.js";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { RuntimeMobileBuilds } from "./RuntimeMobileBuilds.js";
import { assertMobileWorker, type MobileWorkerProof } from "./MobileWorkerLease.js";
import { authorizeMobileBuild, revalidateMobileBuildSpecification, type MobileBuildRecord } from "./MobileBuildRequest.js";
import type { MobilePackageSpecification, MobilePackageValidationContext } from "./MobilePackageSpecification.js";
import { AndroidArtifactStore, AndroidPackagingError, ANDROID_CONFIG_SCRIPT, ANDROID_LIMITS, apkFromDockerTar, denyAndroid, planAndroidPackaging, privateAndroidDirectory, stageAndroidSource, verifyAndroidBadging, type AndroidFailure } from "./AndroidPackaging.js";

export interface AndroidExecutionConfiguration {
  readonly dockerExecutable: string; readonly dockerSocket: string; readonly image: string;
  readonly capacitorVersion: string; readonly buildToolsVersion: string; readonly stagingRoot: string;
  readonly isolationPolicy: "dedicated-linux-vm";
}
export function validateAndroidExecutionConfiguration(config: AndroidExecutionConfiguration): void {
  if (!config || !path.isAbsolute(config.dockerExecutable) || !path.isAbsolute(config.dockerSocket) || !/^[a-z0-9][a-z0-9./_-]*@sha256:[a-f0-9]{64}$/.test(config.image) ||
    !/^\d+\.\d+\.\d+$/.test(config.capacitorVersion) || !/^\d+\.\d+\.\d+$/.test(config.buildToolsVersion) || config.isolationPolicy !== "dedicated-linux-vm") return denyAndroid("invalid_configuration");
  privateAndroidDirectory(config.stagingRoot);
}
/** Trusted host tools only; project commands are passed exclusively to Docker below. No raw output is logged. */
export async function runBoundedAndroidProcess(executable: string, args: readonly string[], environment: NodeJS.ProcessEnv, options: { timeoutMs: number; outputBytes: number; signal?: AbortSignal }): Promise<Buffer> {
  if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 1 || options.timeoutMs > ANDROID_LIMITS.processMs || !Number.isSafeInteger(options.outputBytes) || options.outputBytes < 1 || options.outputBytes > ANDROID_LIMITS.artifactBytes + 4096) return denyAndroid("invalid_configuration");
  if (options.signal?.aborted) return denyAndroid("cancelled");
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], { env: environment, shell: false, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    let failure: AndroidFailure | null = null, count = 0; const output: Buffer[] = [];
    const kill = (reason: AndroidFailure) => { failure ??= reason; if (child.pid) { try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); } } };
    const abort = () => kill("cancelled"); const timer = setTimeout(() => kill("timeout"), options.timeoutMs);
    options.signal?.addEventListener("abort", abort, { once: true });
    child.stdout.on("data", (bytes: Buffer) => { count += bytes.length; if (count > options.outputBytes) kill("process_failed"); else output.push(bytes); });
    child.stderr.on("data", (bytes: Buffer) => { count += bytes.length; if (count > options.outputBytes) kill("process_failed"); });
    const cleanup = () => { clearTimeout(timer); options.signal?.removeEventListener("abort", abort); };
    child.on("error", () => { cleanup(); reject(new AndroidPackagingError(failure ?? "process_failed")); });
    child.on("close", code => { cleanup(); if (failure || code !== 0) reject(new AndroidPackagingError(failure ?? "process_failed")); else resolve(Buffer.concat(output)); });
  });
}
/** Only call with the record just read through Runtime's authorized service. */
export function assertAndroidWorkerAuthority(record: MobileBuildRecord, expectedAttemptId: string, proof: MobileWorkerProof, now: number): void {
  const attempt = record.attempts.at(-1);
  if (!attempt || attempt.attemptId !== expectedAttemptId) return denyAndroid("ownership_lost");
  if (attempt.state === "cancelling") return denyAndroid("cancelled");
  try { assertMobileWorker(attempt.workerLease, proof, now); } catch { return denyAndroid("ownership_lost"); }
  if (!["running", "verifying"].includes(attempt.state)) return denyAndroid("ownership_lost");
}
export function androidContainerLimits(): string[] {
  return ["--pull=never", "--restart=no", "--network=none", "--read-only", "--user=10001:10001", "--cap-drop=ALL", "--security-opt=no-new-privileges:true", "--pids-limit=256", "--cpus=2", "--memory=3g", "--memory-swap=3g", "--ulimit=nofile=1024:1024", "--ulimit=fsize=104857600:104857600", "--tmpfs=/work:rw,exec,nosuid,nodev,size=2147483648,uid=10001,gid=10001", "--tmpfs=/tmp:rw,exec,nosuid,nodev,size=268435456,uid=10001,gid=10001", "--env=HOME=/work/home", "--env=ANDROID_HOME=/opt/android-sdk", "--env=GRADLE_USER_HOME=/work/home/.gradle", "--env=NODE_OPTIONS=--max-old-space-size=768", "--env=JAVA_TOOL_OPTIONS=-Xmx1536m"];
}
export function androidBuildScript(version: string): string {
  if (!/^\d+\.\d+\.\d+$/.test(version)) return denyAndroid("invalid_configuration");
  return `set -eu
mkdir -p /work/home /work/native
cp -R /opt/mobile/cache/npm /work/npm-cache
cp -R /opt/mobile/cache/gradle /work/home/.gradle
cp -R /input/source /work/source
APP_ROOT=$(node -e 'const p=require("/input/plan.json");process.stdout.write(p.applicationRoot==="."?"/work/source":"/work/source/"+p.applicationRoot)')
cd "$APP_ROOT"
npm ci --offline --ignore-scripts --no-audit --no-fund --cache /work/npm-cache --logs-dir /tmp/npm-logs
npm run build --ignore-scripts
cd /work/native
node /input/native-replay.cjs prepare ${version}
node -e 'const fs=require("node:fs"),p=require("/input/plan.json");fs.writeFileSync("capacitor.config.json",JSON.stringify({appId:p.applicationIdentifier,appName:p.applicationName,webDir:"www"}));const path=require("node:path"),root=path.resolve("/work/source",p.applicationRoot),web=path.resolve(root,p.webAssetsDirectory);if(!web.startsWith(root+"/"))throw Error("unsafe-output");function check(p){const s=fs.lstatSync(p);if(s.isSymbolicLink())throw Error("unsafe-output");if(s.isDirectory())for(const n of fs.readdirSync(p))check(path.join(p,n))}check(web);if(!fs.existsSync(path.join(web,"index.html")))throw Error("web-output-missing");fs.cpSync(web,"www",{recursive:true})'
npm ci --offline --ignore-scripts --no-audit --no-fund --cache /work/npm-cache --logs-dir /tmp/npm-logs
./node_modules/.bin/cap add android
node /input/configure.cjs
./node_modules/.bin/cap sync android
node /input/native-replay.cjs verify ${version}
cd android
sh ./gradlew assembleDebug --offline --dependency-verification=strict --init-script /input/enforce-locks.gradle --no-daemon --max-workers=2 -Dorg.gradle.jvmargs=-Xmx1536m
`;
}
/** Actual Docker CLI adapter. It requires a pre-provisioned, digest-pinned image and a
 * dedicated Linux execution daemon explicitly labelled by the operator. No pulls,
 * daemon changes, host dependency installation, host project execution, or background scheduler.
 * The approved image must contain Node/JDK/SDK plus offline npm and Gradle seed caches.
 */
export class AndroidPackagingExecutor {
  readonly configuration: AndroidExecutionConfiguration;
  readonly artifacts: AndroidArtifactStore;
  constructor(configuration: AndroidExecutionConfiguration, artifacts: AndroidArtifactStore) { validateAndroidExecutionConfiguration(configuration); this.configuration = Object.freeze({ ...configuration }); this.artifacts = artifacts; }
  #environment(clientRoot: string): NodeJS.ProcessEnv { return { PATH: "/usr/local/bin:/usr/bin:/bin", HOME: clientRoot, DOCKER_CONFIG: clientRoot, DOCKER_HOST: `unix://${this.configuration.dockerSocket}` }; }
  #docker(args: readonly string[], clientRoot: string, signal?: AbortSignal, timeoutMs = 15000, outputBytes = 1_000_000): Promise<Buffer> {
    return runBoundedAndroidProcess(this.configuration.dockerExecutable, args, this.#environment(clientRoot), { signal, timeoutMs, outputBytes });
  }
  async #remove(name: string, nonce: string, clientRoot: string): Promise<boolean> {
    try { const owner = await this.#docker(["inspect", "--format", '{{index .Config.Labels "korelumina.mobile.owner"}}', name], clientRoot); if (owner.toString().trim() !== nonce) return false;
      await this.#docker(["rm", "--force", name], clientRoot); return true;
    } catch { return false; }
  }
  async preflight(signal?: AbortSignal): Promise<Readonly<{ ready: boolean; reason: "ready" | AndroidFailure }>> {
    if (signal?.aborted) return Object.freeze({ ready: false, reason: "cancelled" });
    const client = fs.mkdtempSync(path.join(this.configuration.stagingRoot, "android-client-"));
    const nonce = randomUUID(), name = `klm-android-probe-${nonce}`; let created = false;
    try {
      const socket = fs.lstatSync(this.configuration.dockerSocket); if (!socket.isSocket() || (process.getuid && socket.uid !== process.getuid())) return { ready: false, reason: "isolation_unavailable" };
      const info = JSON.parse((await this.#docker(["info", "--format", "{{json .}}"], client, signal)).toString());
      if (info.OSType !== "linux" || info.CgroupVersion !== "2" || info.MemoryLimit !== true || info.SwapLimit !== true || info.CpuCfsQuota !== true || info.PidsLimit !== true || !info.SecurityOptions?.some((value: string) => value.startsWith("name=seccomp")) || !info.Labels?.includes("korelumina.mobile.execution=dedicated")) return { ready: false, reason: "isolation_unavailable" };
      if ((await this.#docker(["ps", "--quiet"], client, signal)).toString().trim()) return { ready: false, reason: "isolation_unavailable" };
      try { await this.#docker(["image", "inspect", this.configuration.image], client, signal); } catch { return { ready: false, reason: "toolchain_unavailable" }; }
      const tools = `set -eu; node -e 'const cp=require("node:child_process");for(const c of ["java","javac"]){const r=cp.spawnSync(c,["-version"],{encoding:"utf8"});const m=(String(r.stdout)+String(r.stderr)).match(/(?:javac |version ")(\\d+)/);if(r.status!==0||!m||Number(m[1])<21)process.exit(1)}'; node --version; npm --version; test -d /opt/mobile/cache/npm; test -d /opt/mobile/cache/gradle; /opt/android-sdk/build-tools/${this.configuration.buildToolsVersion}/aapt2 version; /opt/android-sdk/build-tools/${this.configuration.buildToolsVersion}/apksigner --version; node -e 'const t=require("/opt/mobile/toolchain.json");if(t.schemaVersion!=="android-toolchain:v1"||t.capacitorVersion!=="${this.configuration.capacitorVersion}"||t.buildToolsVersion!=="${this.configuration.buildToolsVersion}"||Number(process.versions.node.split(".")[0])<22)process.exit(1)'`;
      await this.#docker(["create", ...androidContainerLimits(), "--name", name, "--label", `korelumina.mobile.owner=${nonce}`, this.configuration.image, "/bin/sh", "-c", tools], client, signal); created = true;
      await this.#docker(["start", "--attach", name], client, signal, 30000);
      if (!(await this.#remove(name, nonce, client))) return { ready: false, reason: "isolation_unavailable" }; created = false;
      return Object.freeze({ ready: true, reason: "ready" });
    } catch (error) { return Object.freeze({ ready: false, reason: signal?.aborted ? "cancelled" : error instanceof AndroidPackagingError && error.code === "timeout" ? "timeout" : "toolchain_unavailable" }); }
    finally { if (created) await this.#remove(name, nonce, client); fs.rmSync(client, { recursive: true, force: true }); }
  }
  async execute(service: RuntimeMobileBuilds, requestId: string, specification: MobilePackageSpecification, context: MobilePackageValidationContext, signal?: AbortSignal): Promise<Readonly<{ ok: boolean; reason: "completed" | AndroidFailure }>> {
    if (!service.readiness().ready) return denyAndroid("isolation_unavailable");
    authorizeMobileBuild(context, context.projectId, "manage");
    const spec = revalidateMobileBuildSpecification(specification, context), plan = planAndroidPackaging(spec, context);
    const initial = service.get(requestId, context);
    if (initial.request.specificationFingerprint !== spec.specificationFingerprint || initial.request.projectId !== context.projectId) return denyAndroid("invalid_source");
    if (plan.executionBlocker) return Object.freeze({ ok: false, reason: plan.executionBlocker });
    const readiness = await this.preflight(signal); if (!readiness.ready) return Object.freeze({ ok: false, reason: readiness.reason as AndroidFailure });
    let workspace: string | null = null, heartbeat: ReturnType<typeof setInterval> | null = null;
    const controller = new AbortController(), nonce = randomUUID(), name = `klm-android-build-${nonce}`, verifierName = `klm-android-verify-${nonce}`;
    let owned = false, verifierOwned = false, cancelled = false, ownershipLost = false, record: MobileBuildRecord = initial, proof: MobileWorkerProof | null = null;
    const stop = () => { cancelled = true; controller.abort(); }; signal?.addEventListener("abort", stop, { once: true });
    try {
      if (signal?.aborted) return denyAndroid("cancelled");
      workspace = stageAndroidSource(context, spec, this.configuration.stagingRoot);
      fs.writeFileSync(path.join(workspace, "plan.json"), JSON.stringify(plan), { mode: 0o444 }); fs.writeFileSync(path.join(workspace, "configure.cjs"), ANDROID_CONFIG_SCRIPT, { mode: 0o444 }); fs.writeFileSync(path.join(workspace, "native-replay.cjs"), ANDROID_NATIVE_REPLAY_SCRIPT, { mode: 0o444 }); fs.writeFileSync(path.join(workspace, "enforce-locks.gradle"), ANDROID_GRADLE_LOCK_POLICY, { mode: 0o444 }); fs.chmodSync(workspace, 0o755);
      // The host parent remains private; bind-mounted input is readable by the container's unprivileged uid.
      const readable = (directory: string) => { fs.chmodSync(directory, 0o755); for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const file = path.join(directory, entry.name); if (entry.isDirectory()) readable(file); else fs.chmodSync(file, 0o444); } }; readable(path.join(workspace, "source"));
      fs.mkdirSync(path.join(workspace, "client"), { mode: 0o700 }); const client = path.join(workspace, "client");
      record = service.claim(requestId, initial.sequence, initial.attempts.at(-1)!.attemptId, `android:${nonce}`, context); proof = { workerId: record.attempts.at(-1)!.workerLease!.workerId, fencingToken: record.attempts.at(-1)!.workerLease!.fencingToken };
      const claimedAttemptId = record.attempts.at(-1)!.attemptId;
      const current = () => { const r = service.get(requestId, context); if (r.attempts.at(-1)!.state === "cancelling") { cancelled = true; controller.abort(); } assertAndroidWorkerAuthority(r, claimedAttemptId, proof!, Date.now()); return r; };
      heartbeat = setInterval(() => { try { record = current(); const attempt = record.attempts.at(-1)!; if (!cancelled && attempt.workerLease!.expiresAt - Date.now() < 30000) record = service.renew(requestId, record.sequence, attempt.attemptId, proof!, context); } catch (error) { if (error instanceof AndroidPackagingError && error.code === "cancelled") cancelled = true; else ownershipLost = true; controller.abort(); } }, 1000);
      await this.#docker(["create", ...androidContainerLimits(), "--name", name, "--label", `korelumina.mobile.owner=${nonce}`, "--mount", `type=bind,source=${workspace},target=/input,readonly`, this.configuration.image, "/bin/sh", "-c", androidBuildScript(this.configuration.capacitorVersion)], client, controller.signal); owned = true;
      await this.#docker(["start", "--attach", name], client, controller.signal, ANDROID_LIMITS.processMs, 2_000_000);
      let archive: Buffer; try { archive = await this.#docker(["cp", `${name}:/work/native/${plan.output}`, "-"], client, controller.signal, 30000, ANDROID_LIMITS.artifactBytes + 4096); } catch (error) { if (error instanceof AndroidPackagingError && ["timeout", "cancelled"].includes(error.code)) throw error; return denyAndroid("artifact_missing"); }
      const bytes = apkFromDockerTar(archive); const file = path.join(workspace, "verify.apk"); fs.writeFileSync(file, bytes, { mode: 0o444 });
      const tools = `/opt/android-sdk/build-tools/${this.configuration.buildToolsVersion}`;
      await this.#docker(["create", ...androidContainerLimits(), "--name", verifierName, "--label", `korelumina.mobile.owner=${nonce}`, "--mount", `type=bind,source=${file},target=/artifact.apk,readonly`, this.configuration.image, "/bin/sh", "-c", `${tools}/apksigner verify /artifact.apk && ${tools}/aapt2 dump badging /artifact.apk`], client, controller.signal); verifierOwned = true;
      const badging = await this.#docker(["start", "--attach", verifierName], client, controller.signal, 30000); verifyAndroidBadging(badging.toString(), plan);
      if (!(await this.#remove(name, nonce, client)) || !(await this.#remove(verifierName, nonce, client))) return denyAndroid("isolation_unavailable"); owned = false; verifierOwned = false;
      record = current(); if (cancelled || signal?.aborted) return denyAndroid("cancelled");
      record = service.transition(requestId, { expectedSequence: record.sequence, attemptId: record.attempts.at(-1)!.attemptId, type: "verify" }, context, proof);
      const artifact = this.artifacts.persist(bytes, record.request, record.attempts.at(-1)!.attemptId, spec, proof.fencingToken);
      record = current(); if (cancelled || signal?.aborted) return denyAndroid("cancelled");
      service.transition(requestId, { expectedSequence: record.sequence, attemptId: record.attempts.at(-1)!.attemptId, type: "complete", artifactReference: artifact.reference }, context, proof);
      return Object.freeze({ ok: true, reason: "completed" });
    } catch (error) {
      let reason: AndroidFailure = ownershipLost ? "ownership_lost" : cancelled || signal?.aborted ? "cancelled" : error instanceof AndroidPackagingError ? error.code : "process_failed";
      let stopped = !owned && !verifierOwned;
      if (workspace) { const client = path.join(workspace, "client"); const first = !owned || await this.#remove(name, nonce, client); const second = !verifierOwned || await this.#remove(verifierName, nonce, client); stopped = first && second; owned = !first; verifierOwned = !second; }
      if (!stopped) reason = "isolation_unavailable";
      if (proof && !ownershipLost && stopped) {
        try { record = service.get(requestId, context); const attempt = record.attempts.at(-1)!; assertMobileWorker(attempt.workerLease, proof, Date.now());
          if (attempt.diagnosticReferences.length < 99 && !attempt.diagnosticReferences.includes(`android:${reason}`)) record = service.transition(requestId, { expectedSequence: record.sequence, attemptId: attempt.attemptId, type: "diagnostic", reference: `android:${reason}` }, context, proof);
          if (cancelled && stopped) {
            if (attempt.state !== "cancelling") record = service.transition(requestId, { expectedSequence: record.sequence, attemptId: attempt.attemptId, type: "cancel" }, context);
            service.transition(requestId, { expectedSequence: record.sequence, attemptId: attempt.attemptId, type: "cancelled" }, context, proof);
          } else service.transition(requestId, { expectedSequence: record.sequence, attemptId: attempt.attemptId, type: "fail", reason: reason === "timeout" ? "timeout" : reason.startsWith("artifact_") ? "artifact_verification_failed" : "build_failure" }, context, proof);
        } catch { reason = "ownership_lost"; }
      }
      return Object.freeze({ ok: false, reason });
    } finally {
      if (heartbeat) clearInterval(heartbeat); signal?.removeEventListener("abort", stop);
      if (workspace) { const client = path.join(workspace, "client"); if (owned) await this.#remove(name, nonce, client); if (verifierOwned) await this.#remove(verifierName, nonce, client); fs.rmSync(workspace, { recursive: true, force: true }); }
    }
  }
}
