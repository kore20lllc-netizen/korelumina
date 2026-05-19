import fs from "fs";
import path from "path";

export type LockKind = "global" | "project";

export type LockFile = {
  kind: LockKind;
  pid: number;
  startedAt: number;   // ms epoch
  expiresAt: number;   // ms epoch
  projectId?: string;
};

export function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
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

function readJson<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonAtomic(filePath: string, data: unknown) {
  const dir = path.dirname(filePath);
  ensureDir(dir);

  const tmp = `${filePath}.tmp_${process.pid}_${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

export function acquireLock(params: {
  lockPath: string;
  kind: LockKind;
  ttlMs: number;
  projectId?: string;
}): { ok: true; lock: LockFile } | { ok: false; reason: "locked"; existing: LockFile } {
  const { lockPath, kind, ttlMs, projectId } = params;

  ensureDir(path.dirname(lockPath));

  const now = Date.now();
  const existing = readJson<LockFile>(lockPath);

  if (existing) {
    const alive = isPidAlive(existing.pid);
    const notExpired = now < existing.expiresAt;

    // If the process is alive AND lock not expired => still locked
    if (alive && notExpired) {
      return { ok: false, reason: "locked", existing };
    }

    // Otherwise, it's stale (dead pid OR expired) => remove it
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // ignore
    }
  }

  const lock: LockFile = {
    kind,
    pid: process.pid,
    startedAt: now,
    expiresAt: now + ttlMs,
    ...(projectId ? { projectId } : {}),
  };

  writeJsonAtomic(lockPath, lock);
  return { ok: true, lock };
}

export function releaseLock(lockPath: string) {
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
}
