import fs from "fs";
import path from "path";

const LOCK_PATH = path.join(process.cwd(), "runtime", "global-lock.json");
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

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

export function acquireGlobalLock(): boolean {
  if (fs.existsSync(LOCK_PATH)) {
    const raw = fs.readFileSync(LOCK_PATH, "utf8");
    const data: LockData = JSON.parse(raw);

    const isAlive = isProcessAlive(data.pid);
    const expired = Date.now() - data.startedAt > TIMEOUT_MS;

    if (isAlive && !expired) {
      return false;
    }

    // stale lock cleanup
    fs.unlinkSync(LOCK_PATH);
  }

  const payload: LockData = {
    pid: process.pid,
    startedAt: Date.now()
  };

  fs.writeFileSync(LOCK_PATH, JSON.stringify(payload, null, 2));
  return true;
}

export function releaseGlobalLock() {
  if (!fs.existsSync(LOCK_PATH)) return;

  const raw = fs.readFileSync(LOCK_PATH, "utf8");
  const data: LockData = JSON.parse(raw);

  if (data.pid === process.pid) {
    fs.unlinkSync(LOCK_PATH);
  }
}
