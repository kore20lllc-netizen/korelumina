import fs from "fs";
import path from "path";

const RUNTIME_ROOT = path.resolve(process.cwd(), "runtime");
const LOCKS_DIR = path.resolve(RUNTIME_ROOT, "locks");

type LockFile = {
  scope: "global" | "project";
  workspaceId?: string;
  projectId?: string;

  holderPid: number;
  acquiredAt: number;
  expiresAt: number;
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function isPidRunning(pid: number) {
  try {
    // signal 0 checks existence without killing
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLock(lockPath: string): LockFile | null {
  try {
    if (!fs.existsSync(lockPath)) return null;
    const raw = fs.readFileSync(lockPath, "utf8");
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    return v as LockFile;
  } catch {
    return null;
  }
}

function writeLock(lockPath: string, lock: LockFile) {
  ensureDir(path.dirname(lockPath));
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), "utf8");
}

function removeLock(lockPath: string) {
  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

function isLockActive(lock: LockFile) {
  const now = Date.now();
  if (lock.expiresAt <= now) return false;
  if (!lock.holderPid) return false;
  return isPidRunning(lock.holderPid);
}

function lockPathGlobal() {
  return path.resolve(LOCKS_DIR, "global.lock.json");
}

function lockPathProject(workspaceId: string, projectId: string) {
  return path.resolve(LOCKS_DIR, "projects", workspaceId, `${projectId}.lock.json`);
}

export function acquireGlobalLock(ttlMs: number = 60_000) {
  const lockPath = lockPathGlobal();
  const existing = readLock(lockPath);

  if (existing && isLockActive(existing)) {
    throw new Error("Global lock is active");
  }

  const lock: LockFile = {
    scope: "global",
    holderPid: process.pid,
    acquiredAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  writeLock(lockPath, lock);

  return () => {
    const cur = readLock(lockPath);
    if (cur?.holderPid === process.pid) removeLock(lockPath);
  };
}

export function acquireProjectLock(
  workspaceId: string,
  projectId: string,
  ttlMs: number = 60_000
) {
  const lockPath = lockPathProject(workspaceId, projectId);
  const existing = readLock(lockPath);

  if (existing && isLockActive(existing)) {
    throw new Error("Project lock is active");
  }

  const lock: LockFile = {
    scope: "project",
    workspaceId,
    projectId,
    holderPid: process.pid,
    acquiredAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  writeLock(lockPath, lock);

  return () => {
    const cur = readLock(lockPath);
    if (cur?.holderPid === process.pid) removeLock(lockPath);
  };
}

export function releaseProjectLock(release: (() => void) | null | undefined) {
  try {
    release?.();
  } catch {
    // ignore
  }
}

export function cleanupExpiredLocks() {
  // Best-effort sweep
  try {
    if (!fs.existsSync(LOCKS_DIR)) return;

    // global
    const g = readLock(lockPathGlobal());
    if (g && !isLockActive(g)) removeLock(lockPathGlobal());

    // project locks
    const projectsDir = path.resolve(LOCKS_DIR, "projects");
    if (!fs.existsSync(projectsDir)) return;

    for (const workspaceId of fs.readdirSync(projectsDir)) {
      const wdir = path.resolve(projectsDir, workspaceId);
      if (!fs.statSync(wdir).isDirectory()) continue;

      for (const file of fs.readdirSync(wdir)) {
        if (!file.endsWith(".lock.json")) continue;
        const lp = path.resolve(wdir, file);
        const lock = readLock(lp);
        if (lock && !isLockActive(lock)) removeLock(lp);
      }
    }
  } catch {
    // ignore
  }
}
