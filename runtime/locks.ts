import fs from "fs";
import path from "path";

export type LockRecord = {
  pid: number;
  jobId: string;
  workspaceId: string;
  projectId?: string; // undefined for global lock
  startedAt: number;
  updatedAt: number;
};

export type AcquireResult =
  | { ok: true; lock: LockRecord }
  | { ok: false; reason: "locked"; lock: LockRecord }
  | { ok: false; reason: "invalid"; message: string };

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(file: string): T | null {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function isPidAlive(pid: number): boolean {
  try {
    // signal 0 does not kill the process; it only checks existence/permission
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function isStale(lock: LockRecord, staleMs: number): boolean {
  const now = Date.now();
  const updatedAt = typeof lock.updatedAt === "number" ? lock.updatedAt : lock.startedAt;
  return now - updatedAt > staleMs;
}

export function acquireLock(
  lockPath: string,
  next: LockRecord,
  opts: { staleMs: number }
): AcquireResult {
  if (!lockPath) return { ok: false, reason: "invalid", message: "Missing lockPath" };

  const existing = readJson<LockRecord>(lockPath);

  if (!existing) {
    writeJson(lockPath, next);
    return { ok: true, lock: next };
  }

  // stale by time OR dead PID → clear
  const pidAlive = typeof existing.pid === "number" && isPidAlive(existing.pid);
  if (!pidAlive || isStale(existing, opts.staleMs)) {
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // ignore
    }
    writeJson(lockPath, next);
    return { ok: true, lock: next };
  }

  return { ok: false, reason: "locked", lock: existing };
}

export function touchLock(lockPath: string) {
  const existing = readJson<LockRecord>(lockPath);
  if (!existing) return;
  existing.updatedAt = Date.now();
  writeJson(lockPath, existing);
}

export function releaseLock(lockPath: string, jobId?: string) {
  const existing = readJson<LockRecord>(lockPath);
  if (!existing) return;

  // If jobId is provided, only release if it matches (prevents another job from nuking a newer lock)
  if (jobId && existing.jobId !== jobId) return;

  try {
    fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
}
