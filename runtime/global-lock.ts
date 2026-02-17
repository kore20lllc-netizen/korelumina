import path from "path";
import { acquireLock, releaseLock, touchLock } from "./locks";

const GLOBAL_LOCK_PATH = path.resolve("runtime/locks/global.lock");
const STALE_MS = 15 * 60 * 1000; // 15 minutes

export function acquireGlobalLock(jobId: string, workspaceId: string) {
  return acquireLock(
    GLOBAL_LOCK_PATH,
    {
      pid: process.pid,
      jobId,
      workspaceId,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    },
    { staleMs: STALE_MS }
  );
}

export function heartbeatGlobal() {
  touchLock(GLOBAL_LOCK_PATH);
}

export function releaseGlobalLock(jobId: string) {
  releaseLock(GLOBAL_LOCK_PATH, jobId);
}

export function getGlobalLockPath() {
  return GLOBAL_LOCK_PATH;
}
