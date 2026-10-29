import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRuntimeDataRoot } from "../projects/workspacePaths.js";
import type { MobilePackageSpecification } from "./MobilePackageSpecification.js";
import { classifyMobileBuildFailure, freezeMobileBuildValue, mobileBuildCanonical, mobileBuildContractFailure, mobileBuildHash, mobileBuildReference, type MobileBuildRecord } from "./MobileBuildRequest.js";

export interface MobileBuildEntry { readonly record: MobileBuildRecord; readonly specification: MobilePackageSpecification }
export interface MobileBuildStore {
  read(projectId: string, requestId: string): MobileBuildEntry | null;
  admit(entry: MobileBuildEntry): MobileBuildEntry;
  compareAndSwap(expectedSequence: number, entry: MobileBuildEntry): MobileBuildEntry;
  history(projectId: string, requestId: string): readonly MobileBuildRecord[];
}
export class MobileBuildPersistenceError extends Error {
  constructor(readonly code: "persistence_unavailable" | "persistence_corrupt" | "persistence_commit_uncertain") { super(code); this.name = "MobileBuildPersistenceError"; }
}
const unavailable = (): never => { throw new MobileBuildPersistenceError("persistence_unavailable"); };
const corrupt = (): never => { throw new MobileBuildPersistenceError("persistence_corrupt"); };
const key = (entry: MobileBuildEntry) => mobileBuildHash({ projectId: entry.record.request.projectId, requestedBy: entry.record.request.requestedBy, key: entry.record.request.idempotencyKey });
/** Backward-compatible isolated contract store; production durability uses FileMobileBuildStore. */
export class MemoryMobileBuildStore implements MobileBuildStore {
  #entries = new Map<string, MobileBuildEntry[]>();
  #keys = new Map<string, string>();
  read(projectId: string, requestId: string): MobileBuildEntry | null {
    const versions = this.#entries.get(requestId); const entry = versions?.[versions.length - 1];
    return entry?.record.request.projectId === projectId ? entry : null;
  }
  admit(entry: MobileBuildEntry): MobileBuildEntry {
    const existingId = this.#keys.get(key(entry));
    if (existingId) {
      if (existingId !== entry.record.request.requestId) return mobileBuildContractFailure("idempotency_conflict");
      return this.read(entry.record.request.projectId, existingId)!;
    }
    if (this.#entries.size >= 1000) return mobileBuildContractFailure("capacity_exceeded");
    const frozen = freezeMobileBuildValue(entry);
    this.#entries.set(entry.record.request.requestId, [frozen]); this.#keys.set(key(entry), entry.record.request.requestId); return frozen;
  }
  compareAndSwap(expectedSequence: number, entry: MobileBuildEntry): MobileBuildEntry {
    const current = this.read(entry.record.request.projectId, entry.record.request.requestId);
    if (!current || current.record.sequence !== expectedSequence) return mobileBuildContractFailure("stale_transition");
    checkSuccessor(current, entry);
    const frozen = freezeMobileBuildValue(entry); this.#entries.get(entry.record.request.requestId)!.push(frozen); return frozen;
  }
  history(projectId: string, requestId: string): readonly MobileBuildRecord[] {
    return freezeMobileBuildValue(this.read(projectId, requestId) ? this.#entries.get(requestId)!.map(entry => entry.record) : []);
  }
}
interface Revision { schemaVersion: "mobile-build-journal:v1"; previousFingerprint: string | null; entry: MobileBuildEntry; fingerprint: string }
const fileName = (sequence: number) => `${String(sequence).padStart(6, "0")}.json`;
const same = (a: unknown, b: unknown) => mobileBuildCanonical(a) === mobileBuildCanonical(b);
function checkEntry(entry: MobileBuildEntry): void {
  const { record, specification } = entry;
  if (!record || !specification || !Number.isSafeInteger(record.sequence) || record.sequence < 0 || record.sequence > 1000 || !Array.isArray(record.attempts) ||
    record.attempts.length < 1 || record.attempts.length > record.request.maxAttempts || record.request.maxAttempts > 3 || record.distributionVerification !== "not-performed") return corrupt();
  const { requestId, requestFingerprint, ...requestBody } = record.request;
  const { specificationFingerprint, ...specBody } = specification;
  if (mobileBuildHash(requestBody) !== requestFingerprint || requestId !== `mobile-request:${requestFingerprint}` || mobileBuildHash(specBody) !== specificationFingerprint ||
    record.request.specificationFingerprint !== specificationFingerprint || record.request.projectId !== specification.projectId || record.request.target !== specification.target ||
    record.request.applicationRoot !== specification.applicationRoot || record.request.applicationIdentifier !== specification.applicationIdentifier ||
    record.request.profile !== specification.build.mode || record.request.sourceSnapshotFingerprint !== specification.sourceSnapshotFingerprint ||
    record.request.compatibilityReportFingerprint !== specification.compatibilityReportFingerprint || record.request.schemaVersion !== "mobile-build-request:v1" ||
    specification.schemaVersion !== "mobile-package-specification:v1") return corrupt();
  record.attempts.forEach((attempt, index) => {
    if (attempt.number !== index + 1 || attempt.attemptId !== `mobile-attempt:${mobileBuildHash({ requestId, number: index + 1 })}` ||
      !["queued", "running", "verifying", "cancelling", "completed", "failed", "cancelled"].includes(attempt.state) ||
      !Array.isArray(attempt.diagnosticReferences) || attempt.diagnosticReferences.length > 100 ||
      (index < record.attempts.length - 1 && !["failed", "cancelled"].includes(attempt.state)) ||
      ((attempt.state === "failed") !== (attempt.failure !== null)) || ((attempt.state === "completed") !== (attempt.artifact !== null))) return corrupt();
    if (new Set(attempt.diagnosticReferences).size !== attempt.diagnosticReferences.length || attempt.diagnosticReferences.some((ref: unknown) => !mobileBuildReference(ref)) ||
      (attempt.failure && !same(attempt.failure, classifyMobileBuildFailure(attempt.failure.classification)))) return corrupt();
    if (attempt.artifact) {
      const a = attempt.artifact;
      if (!mobileBuildReference(a.reference) || a.verification !== "verified" || a.requestId !== requestId || a.attemptId !== attempt.attemptId || a.projectId !== specification.projectId ||
        a.specificationFingerprint !== specificationFingerprint || a.sourceSnapshotFingerprint !== specification.sourceSnapshotFingerprint || a.target !== specification.target ||
        a.applicationIdentifier !== specification.applicationIdentifier || a.format !== specification.artifact.format || a.version !== specification.version || a.buildNumber !== specification.buildNumber ||
        !Number.isSafeInteger(a.bytes) || a.bytes < 1 || !/^[a-f0-9]{64}$/.test(a.sha256) || a.signing !== (specification.artifact.signing === "required" ? "verified" : "unsigned")) return corrupt();
    }
  });
}
function checkSuccessor(previous: MobileBuildEntry, next: MobileBuildEntry): void {
  checkEntry(next);
  const before = previous.record, after = next.record;
  if (after.sequence !== before.sequence + 1 || !same(before.request, after.request) || !same(previous.specification, next.specification)) return corrupt();
  const old = before.attempts[before.attempts.length - 1];
  if (after.attempts.length === before.attempts.length + 1) {
    const fresh = after.attempts[after.attempts.length - 1];
    if (!(old.state === "cancelled" || (old.state === "failed" && old.failure?.retryable)) || !same(before.attempts, after.attempts.slice(0, -1)) ||
      fresh.state !== "queued" || fresh.diagnosticReferences.length || fresh.failure || fresh.artifact) return corrupt();
  } else {
    const last = after.attempts[after.attempts.length - 1];
    const allowed: Record<string, string[]> = { queued: ["queued", "running", "cancelled", "failed"], running: ["running", "verifying", "cancelling", "failed"], verifying: ["verifying", "completed", "cancelling", "failed"], cancelling: ["cancelling", "cancelled", "failed"] };
    if (after.attempts.length !== before.attempts.length || !same(before.attempts.slice(0, -1), after.attempts.slice(0, -1)) || !allowed[old.state]?.includes(last.state) ||
      !same(old.diagnosticReferences, last.diagnosticReferences.slice(0, old.diagnosticReferences.length)) ||
      (last.state === old.state && last.diagnosticReferences.length !== old.diagnosticReferences.length + 1)) return corrupt();
  }
}

/** Append-only Runtime data files, not a second identity/authorization registry.
 * Publication uses fsynced temporary bytes + exclusive hard link (no replacement),
 * then directory fsync. All cooperating processes contend on the same revision name.
 * Requires a trusted local filesystem with atomic hard links and directory fsync;
 * unsupported filesystems fail closed. No stale locks or lock-stealing recovery.
 */
export class FileMobileBuildStore implements MobileBuildStore {
  readonly storageRoot: string;
  constructor(options: { storageRoot?: string } = {}) { this.storageRoot = path.resolve(options.storageRoot ?? path.join(getRuntimeDataRoot(), "mobile-builds")); }
  #directory(directory: string, create = false): boolean {
    if (create && !fs.existsSync(directory)) {
      const parent = path.dirname(directory);
      if (parent !== directory) this.#directory(parent, true);
      try { fs.mkdirSync(directory, { mode: 0o700 }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
      this.#sync(parent);
    }
    try {
      if (!fs.lstatSync(directory).isDirectory() || fs.realpathSync(directory) !== directory) return unavailable();
      return true;
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT" && !create) return false; throw error; }
  }
  #project(projectId: string, create = false): string | null {
    if (!/^[a-zA-Z0-9._-]{1,128}$/.test(projectId) || [".", ".."].includes(projectId)) return unavailable();
    if (!this.#directory(this.storageRoot, create)) return null;
    const directory = path.join(this.storageRoot, projectId);
    return this.#directory(directory, create) ? directory : null;
  }
  #readFile(file: string): Revision {
    const descriptor = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
      const stat = fs.fstatSync(descriptor); if (!stat.isFile() || stat.size > 2_000_000) return corrupt();
      return JSON.parse(fs.readFileSync(descriptor, "utf8")) as Revision;
    } finally { fs.closeSync(descriptor); }
  }
  #journal(directory: string): Revision[] {
    if (!this.#directory(directory)) return [];
    const names = fs.readdirSync(directory).filter(name => !name.endsWith(".tmp")).sort();
    if (names.length > 1001) return corrupt();
    const frames: Revision[] = [];
    for (const [index, name] of names.entries()) {
      if (name !== fileName(index)) return corrupt();
      const frame = this.#readFile(path.join(directory, name));
      const { fingerprint, ...body } = frame;
      if (frame.schemaVersion !== "mobile-build-journal:v1" || mobileBuildHash(body) !== fingerprint ||
        frame.previousFingerprint !== (frames[index - 1]?.fingerprint ?? null) || frame.entry.record.sequence !== index || key(frame.entry) !== path.basename(directory)) return corrupt();
      checkEntry(frame.entry);
      if (index) checkSuccessor(frames[index - 1].entry, frame.entry);
      else if (frame.entry.record.attempts.length !== 1 || frame.entry.record.attempts[0].state !== "queued" || frame.entry.record.attempts[0].diagnosticReferences.length) return corrupt();
      frames.push(frame);
    }
    return frames;
  }
  #find(projectId: string, requestId: string): { directory: string; frames: Revision[] } | null {
    if (!/^mobile-request:[a-f0-9]{64}$/.test(requestId)) return null;
    const root = this.#project(projectId); if (!root) return null;
    const groups = fs.readdirSync(root).sort();
    for (const group of groups) {
      if (!/^[a-f0-9]{64}$/.test(group)) return corrupt();
      const directory = path.join(root, group); const frames = this.#journal(directory);
      if (frames.some(frame => frame.entry.record.request.projectId !== projectId)) return corrupt();
      if (frames[0]?.entry.record.request.requestId === requestId) return { directory, frames };
    }
    return null;
  }
  #guard<T>(work: () => T): T {
    try { return work(); }
    catch (error) {
      if (error instanceof MobileBuildPersistenceError || (error instanceof Error && error.name === "MobileBuildContractError")) throw error;
      if (error instanceof SyntaxError || error instanceof TypeError) return corrupt();
      return unavailable();
    }
  }
  #sync(directory: string): void { const fd = fs.openSync(directory, fs.constants.O_RDONLY); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } }
  #durable(directory: string): void {
    this.#sync(directory); this.#sync(path.dirname(directory)); this.#sync(this.storageRoot); this.#sync(path.dirname(this.storageRoot));
  }
  #publish(directory: string, entry: MobileBuildEntry, previousFingerprint: string | null): boolean {
    this.#directory(directory, true);
    const body = { schemaVersion: "mobile-build-journal:v1" as const, previousFingerprint, entry };
    const data = JSON.stringify({ ...body, fingerprint: mobileBuildHash(body) });
    if (Buffer.byteLength(data) > 2_000_000) return unavailable();
    const temporary = path.join(directory, `${process.pid}-${randomUUID()}.tmp`);
    const fd = fs.openSync(temporary, "wx", 0o600);
    let published = false;
    try {
      try { fs.writeFileSync(fd, data); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      try { fs.linkSync(temporary, path.join(directory, fileName(entry.record.sequence))); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") return false; throw error; }
      published = true;
      this.#durable(directory);
      return true;
    } catch (error) {
      // Publication may already be visible. Never acknowledge success or pretend rollback.
      if (published) throw new MobileBuildPersistenceError("persistence_commit_uncertain");
      throw error;
    } finally {
      try { fs.unlinkSync(temporary); } catch { /* Unpublished crash leftovers are never authoritative. */ }
    }
  }
  read(projectId: string, requestId: string): MobileBuildEntry | null {
    return this.#guard(() => { const found = this.#find(projectId, requestId); if (!found) return null; this.#durable(found.directory); return freezeMobileBuildValue(found.frames[found.frames.length - 1].entry); });
  }
  admit(entry: MobileBuildEntry): MobileBuildEntry {
    return this.#guard(() => {
      checkEntry(entry); const projectId = entry.record.request.projectId; const root = this.#project(projectId, true)!;
      const directory = path.join(root, key(entry));
      if (entry.record.sequence !== 0 || entry.record.attempts.length !== 1 || entry.record.attempts[0].state !== "queued" || entry.record.attempts[0].diagnosticReferences.length) return corrupt();
      const prior = this.#journal(directory);
      if (prior.length) {
        const existing = prior[prior.length - 1].entry;
        if (existing.record.request.requestId !== entry.record.request.requestId) return mobileBuildContractFailure("idempotency_conflict");
        this.#durable(directory);
        return freezeMobileBuildValue(existing);
      }
      if (this.#publish(directory, entry, null)) return freezeMobileBuildValue(entry);
      const frames = this.#journal(directory); const existing = frames[frames.length - 1]?.entry;
      if (!existing) return unavailable();
      if (existing.record.request.requestId !== entry.record.request.requestId) return mobileBuildContractFailure("idempotency_conflict");
      this.#durable(directory);
      return freezeMobileBuildValue(existing);
    });
  }
  compareAndSwap(expectedSequence: number, entry: MobileBuildEntry): MobileBuildEntry {
    return this.#guard(() => {
      const found = this.#find(entry.record.request.projectId, entry.record.request.requestId); const previous = found?.frames[found.frames.length - 1];
      if (!found || !previous || previous.entry.record.sequence !== expectedSequence) return mobileBuildContractFailure("stale_transition");
      checkSuccessor(previous.entry, entry);
      if (!this.#publish(found.directory, entry, previous.fingerprint)) return mobileBuildContractFailure("stale_transition");
      return freezeMobileBuildValue(entry);
    });
  }
  history(projectId: string, requestId: string): readonly MobileBuildRecord[] {
    return this.#guard(() => { const found = this.#find(projectId, requestId); if (!found) return freezeMobileBuildValue([]); this.#durable(found.directory); return freezeMobileBuildValue(found.frames.map(frame => frame.entry.record)); });
  }
}
