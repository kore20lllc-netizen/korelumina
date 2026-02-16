import fs from "fs";
import path from "path";

const LOCK_PATH = path.join(process.cwd(), "runtime", "global-build.lock");

export function isGlobalLocked() {
  return fs.existsSync(LOCK_PATH);
}

export function lockGlobal() {
  fs.writeFileSync(LOCK_PATH, "locked");
}

export function unlockGlobal() {
  if (fs.existsSync(LOCK_PATH)) {
    fs.unlinkSync(LOCK_PATH);
  }
}
