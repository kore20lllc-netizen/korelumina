import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MobileBuildLifecycle } from "./MobileBuildLifecycle.js";
import { FileMobileBuildStore, MobileBuildPersistenceError } from "./MobileBuildStore.js";
import type { MobileArtifactVerifier, MobileBuildCommand, MobileBuildRecord } from "./MobileBuildRequest.js";
import type { MobilePackageSpecification, MobilePackageValidationContext } from "./MobilePackageSpecification.js";

export type MobileBuildReadinessReason = "ready" | "storage_configuration_missing" | "storage_configuration_invalid" |
  "storage_path_unsafe" | "storage_corrupt" | "storage_unavailable" | "storage_in_use" | "storage_initialization_failed" |
  "storage_ownership_lost" | "storage_failed" | "closed" | "shutdown_failed";
export interface MobileBuildReadiness {
  readonly schemaVersion: "mobile-runtime-readiness:v1";
  readonly ready: boolean;
  readonly storage: "durable-file";
  readonly writerMode: "exclusive-local";
  readonly nativeExecutionReady: false;
  readonly reason: MobileBuildReadinessReason;
  readonly checks: Readonly<{ ownerClaim: boolean; writeReadSync: boolean; exclusivePublication: boolean }>;
}
export type RuntimeMobileBuildInitialization =
  | { readonly ready: true; readonly readiness: MobileBuildReadiness; readonly service: RuntimeMobileBuilds }
  | { readonly ready: false; readonly readiness: MobileBuildReadiness; readonly service: null };
export class RuntimeMobileBuildUnavailable extends Error {
  constructor(readonly code: MobileBuildReadinessReason) { super(code); this.name = "RuntimeMobileBuildUnavailable"; }
}
const deny = (reason: MobileBuildReadinessReason): never => { throw new RuntimeMobileBuildUnavailable(reason); };
const sync = (directory: string) => { const fd = fs.openSync(directory, fs.constants.O_RDONLY); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } };
const status = (reason: MobileBuildReadinessReason, checked = false): MobileBuildReadiness => Object.freeze({
  schemaVersion: "mobile-runtime-readiness:v1", ready: reason === "ready", storage: "durable-file", writerMode: "exclusive-local", nativeExecutionReady: false,
  reason, checks: Object.freeze({ ownerClaim: checked, writeReadSync: checked, exclusivePublication: checked }),
});
type Identity = { ino: number; dev: number };
const sameIdentity = (left: Identity, right: Identity) => left.ino === right.ino && left.dev === right.dev;
function rootIdentity(root: string): fs.Stats {
  const info = fs.lstatSync(root);
  // A pre-provisioned, dedicated private directory; no relative paths or symlink aliases.
  if (!info.isDirectory() || fs.realpathSync(root) !== root || (info.mode & 0o077) !== 0 ||
    (process.getuid && info.uid !== process.getuid())) return deny("storage_path_unsafe");
  fs.accessSync(root, fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK);
  return info;
}
function validateContents(root: string): void {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === ".runtime-owner" || entry.name.startsWith(".mobile-probe-")) continue;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(entry.name) || !entry.isDirectory()) return deny("storage_path_unsafe");
  }
}
function probe(root: string): void {
  const directory = path.join(root, `.mobile-probe-${randomUUID()}`);
  fs.mkdirSync(directory, { mode: 0o700 });
  try {
    const source = path.join(directory, "source"), other = path.join(directory, "other"), published = path.join(directory, "published");
    const token = randomUUID();
    for (const [file, bytes] of [[source, token], [other, "must-not-replace"]]) {
      const fd = fs.openSync(file, "wx", 0o600); try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    }
    if (fs.readFileSync(source, "utf8") !== token) return deny("storage_initialization_failed");
    fs.linkSync(source, published);
    let excluded = false;
    try { fs.linkSync(other, published); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; excluded = true; }
    if (!excluded || fs.readFileSync(published, "utf8") !== token) return deny("storage_initialization_failed");
    sync(directory); sync(root);
  } finally {
    // Only this invocation's probe paths are removed; no journal or other owner's data is touched.
    for (const name of ["source", "other", "published"]) { try { fs.unlinkSync(path.join(directory, name)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; } }
    fs.rmdirSync(directory); sync(root);
  }
}

/** Explicit initialization boundary for future Runtime consumers. No import-time I/O,
 * startup hooks, public routes, jobs, workers, or implicit memory fallback.
 * Storage mode is an operator assertion of a local filesystem, not NFS certification.
 * The Runtime owner must call close() on orderly shutdown. Stale claims fail closed;
 * operators must establish the previous owner has stopped before offline recovery.
 */
export class RuntimeMobileBuilds {
  #root: string;
  #token: string;
  #rootIdentity: Identity;
  #claimIdentity: Identity;
  #lifecycle: MobileBuildLifecycle;
  #state: MobileBuildReadiness = status("ready", true);
  #closed = false;
  private constructor(root: string, token: string, rootInfo: Identity, claimInfo: Identity, store: FileMobileBuildStore, verify?: MobileArtifactVerifier) {
    this.#root = root; this.#token = token; this.#rootIdentity = rootInfo; this.#claimIdentity = claimInfo;
    this.#lifecycle = new MobileBuildLifecycle(verify, store);
  }
  static initialize(options: { environment?: NodeJS.ProcessEnv; verifyArtifact?: MobileArtifactVerifier } = {}): RuntimeMobileBuildInitialization {
    const environment = options.environment ?? process.env;
    const root = environment.KORELUMINA_MOBILE_BUILD_STORAGE_ROOT;
    const mode = environment.KORELUMINA_MOBILE_BUILD_STORAGE_MODE;
    if (!root?.trim() || !mode?.trim()) return Object.freeze({ ready: false, readiness: status("storage_configuration_missing"), service: null });
    if (mode !== "exclusive-local" || !path.isAbsolute(root) || root !== path.resolve(root) || root.trim() !== root || /[\x00-\x1f\x7f]/.test(root) || root === path.parse(root).root) {
      return Object.freeze({ ready: false, readiness: status("storage_configuration_invalid"), service: null });
    }
    let owned = false; let rootInfo: Identity | null = null; let claimInfo: Identity | null = null; const claim = path.join(root, ".runtime-owner"); const token = randomUUID();
    try {
      rootInfo = rootIdentity(root); validateContents(root);
      try { fs.mkdirSync(claim, { mode: 0o700 }); owned = true; }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") return deny("storage_in_use"); throw error; }
      claimInfo = fs.lstatSync(claim);
      const fd = fs.openSync(path.join(claim, "owner.json"), "wx", 0o600);
      try { fs.writeFileSync(fd, JSON.stringify({ schemaVersion: "mobile-runtime-owner:v1", pid: process.pid, token })); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      sync(claim); sync(root); probe(root);
      if (!sameIdentity(rootInfo, rootIdentity(root))) return deny("storage_ownership_lost");
      const store = new FileMobileBuildStore({ storageRoot: root });
      store.validateStorage();
      const service = new RuntimeMobileBuilds(root, token, rootInfo, claimInfo, store, options.verifyArtifact);
      const readiness = service.readiness(); if (!readiness.ready) return deny(readiness.reason);
      return Object.freeze({ ready: true, readiness, service });
    } catch (error) {
      if (owned && rootInfo && claimInfo) {
        try {
          if (sameIdentity(rootInfo, fs.lstatSync(root)) && sameIdentity(claimInfo, fs.lstatSync(claim))) {
            try { fs.unlinkSync(path.join(claim, "owner.json")); } catch (cleanup) { if ((cleanup as NodeJS.ErrnoException).code !== "ENOENT") throw cleanup; }
            fs.rmdirSync(claim); sync(root);
          }
        } catch { /* Retained claims require offline recovery; replaced roots/claims are never removed. */ }
      }
      const reason = error instanceof RuntimeMobileBuildUnavailable ? error.code : error instanceof MobileBuildPersistenceError && error.code === "persistence_corrupt" ? "storage_corrupt" : (error as NodeJS.ErrnoException).code === "ENOENT" || (error as NodeJS.ErrnoException).code === "EACCES" ? "storage_unavailable" : "storage_initialization_failed";
      return Object.freeze({ ready: false, readiness: status(reason), service: null });
    }
  }
  #ownsStorage(): void {
    if (!sameIdentity(this.#rootIdentity, rootIdentity(this.#root))) return deny("storage_ownership_lost");
    const claim = path.join(this.#root, ".runtime-owner");
    const info = fs.lstatSync(claim); if (!info.isDirectory() || !sameIdentity(this.#claimIdentity, info)) return deny("storage_ownership_lost");
    const fd = fs.openSync(path.join(claim, "owner.json"), fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
      const bytes = fs.fstatSync(fd); if (!bytes.isFile() || bytes.size > 1000) return deny("storage_ownership_lost");
      const owner = JSON.parse(fs.readFileSync(fd, "utf8")); if (owner.token !== this.#token) return deny("storage_ownership_lost");
    } finally { fs.closeSync(fd); }
  }
  readiness(): MobileBuildReadiness {
    if (this.#state.ready) { try { this.#ownsStorage(); } catch { this.#state = status("storage_ownership_lost"); } }
    return this.#state;
  }
  #run<T>(work: () => T): T {
    const readiness = this.readiness(); if (!readiness.ready) return deny(readiness.reason);
    try { return work(); }
    catch (error) { if (error instanceof MobileBuildPersistenceError) this.#state = status("storage_failed"); throw error; }
  }
  create(input: unknown, specification: MobilePackageSpecification, context: MobilePackageValidationContext): MobileBuildRecord { return this.#run(() => this.#lifecycle.create(input, specification, context)); }
  get(requestId: string, context: MobilePackageValidationContext): MobileBuildRecord { return this.#run(() => this.#lifecycle.get(requestId, context)); }
  transition(requestId: string, command: MobileBuildCommand, context: MobilePackageValidationContext): MobileBuildRecord { return this.#run(() => this.#lifecycle.transition(requestId, command, context)); }
  retry(requestId: string, expectedSequence: number, context: MobilePackageValidationContext): MobileBuildRecord { return this.#run(() => this.#lifecycle.retry(requestId, expectedSequence, context)); }
  history(requestId: string, context: MobilePackageValidationContext): readonly MobileBuildRecord[] { return this.#run(() => this.#lifecycle.history(requestId, context)); }
  close(): MobileBuildReadiness {
    if (this.#closed) return this.#state;
    this.#closed = true; this.#state = status("closed");
    try { this.#ownsStorage(); const claim = path.join(this.#root, ".runtime-owner"); fs.unlinkSync(path.join(claim, "owner.json")); fs.rmdirSync(claim); sync(this.#root); }
    catch { this.#state = status("shutdown_failed"); }
    return this.#state;
  }
}
