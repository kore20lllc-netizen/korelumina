import fs from "fs";
import path from "path";

const LOCK_PATH = path.join(process.cwd(), "runtime", "global.lock");

export function acquireGlobalLock(): boolean {
  if (fs.existsSync(LOCK_PATH)) {
    return false;
  }

  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  fs.writeFileSync(LOCK_PATH, String(process.pid), "utf8");
  return true;
}

export function releaseGlobalLock() {
  if (fs.existsSync(LOCK_PATH)) {
    fs.unlinkSync(LOCK_PATH);
  }
}
