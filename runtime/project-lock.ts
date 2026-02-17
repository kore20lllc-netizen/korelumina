import fs from "fs";
import path from "path";

const TIMEOUT_MS = 10 * 60 * 1000;

type LockData = {
  pid: number;
  startedAt: number;
};

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getLockPath(projectId: string) {
  return path.join(process.cwd(), "runtime", "projects", projectId, "lock.json");
}

export function acquireProjectLock(projectId: string): boolean {
  const lockPath = getLockPath(projectId);

  if (fs.existsSync(lockPath)) {
    const raw = fs.readFileSync(lockPath, "utf8");
    const data: LockData = JSON.parse(raw);

    const isAlive = isProcessAlive(data.pid);
    const expired = Date.now() - data.startedAt > TIMEOUT_MS;

    if (isAlive && !expired) {
      return false;
    }

    fs.unlinkSync(lockPath);
  }

  const payload: LockData = {
    pid: process.pid,
    startedAt: Date.now()
  };

  fs.writeFileSync(lockPath, JSON.stringify(payload, null, 2));
  return true;
}

export function releaseProjectLock(projectId: string) {
  const lockPath = getLockPath(projectId);

  if (!fs.existsSync(lockPath)) return;

  const raw = fs.readFileSync(lockPath, "utf8");
  const data: LockData = JSON.parse(raw);

  if (data.pid === process.pid) {
    fs.unlinkSync(lockPath);
  }
}
