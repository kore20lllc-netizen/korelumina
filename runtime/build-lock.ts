import fs from "fs";
import path from "path";

const LOCK_DIR = path.join(process.cwd(), "runtime", "locks");

if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

function getLockFile(projectId: string) {
  return path.join(LOCK_DIR, `${projectId}.lock`);
}

export function isLocked(projectId: string) {
  return fs.existsSync(getLockFile(projectId));
}

export function acquireLock(projectId: string) {
  const file = getLockFile(projectId);
  if (fs.existsSync(file)) {
    return false;
  }
  fs.writeFileSync(file, String(Date.now()));
  return true;
}

export function releaseLock(projectId: string) {
  const file = getLockFile(projectId);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

export function clearStaleLocks(maxAgeMs = 1000 * 60 * 10) {
  const files = fs.readdirSync(LOCK_DIR);
  const now = Date.now();

  for (const f of files) {
    const full = path.join(LOCK_DIR, f);
    const ts = Number(fs.readFileSync(full, "utf8"));
    if (now - ts > maxAgeMs) {
      fs.unlinkSync(full);
    }
  }
}
