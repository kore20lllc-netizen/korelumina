import fs from "fs";
import path from "path";

export type LockScope = "global" | "project";

export type LockState = {
  scope: LockScope;
  projectId?: string;
  pid: number;
  jobId?: string;
  startedAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function rm(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

export function isPidAlive(pid: number): boolean {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function isStaleLock(lock: LockState, staleMs: number): boolean {
  const now = Date.now();
  const age = now - (lock.updatedAt || lock.startedAt || 0);
  if (age > staleMs) return true;
  if (!isPidAlive(lock.pid)) return true;
  return false;
}

export function touchLock(lockPath: string) {
  const lock = safeReadJson<LockState>(lockPath);
  if (!lock) return;
  lock.updatedAt = Date.now();
  writeJson(lockPath, lock);
}

export function readLock(lockPath: string): LockState | null {
  return safeReadJson<LockState>(lockPath);
}

export function clearIfStale(lockPath: string, staleMs: number): { cleared: boolean; reason?: string } {
  const lock = safeReadJson<LockState>(lockPath);
  if (!lock) return { cleared: false };
  if (isStaleLock(lock, staleMs)) {
    rm(lockPath);
    return { cleared: true, reason: "stale-or-dead-pid" };
  }
  return { cleared: false };
}

/**
 * Best-effort lock acquisition.
 * - If lock exists and is stale => clears then acquires
 * - If lock exists and active => returns ok:false
 * - Otherwise writes lock and returns ok:true
 */
export function acquireLock(lockPath: string, state: Omit<LockState, "updatedAt">, staleMs: number) {
  clearIfStale(lockPath, staleMs);

  const existing = safeReadJson<LockState>(lockPath);
  if (existing) {
    return { ok: false as const, existing };
  }

  const now = Date.now();
  const lock: LockState = {
    ...state,
    updatedAt: now
  };

  writeJson(lockPath, lock);

  // Verify we actually own it (best-effort in case of races)
  const verify = safeReadJson<LockState>(lockPath);
  if (!verify || verify.pid !== lock.pid || verify.startedAt !== lock.startedAt) {
    return { ok: false as const, existing: verify ?? undefined };
  }

  return { ok: true as const, lock };
}

export function releaseLock(lockPath: string) {
  rm(lockPath);
}
