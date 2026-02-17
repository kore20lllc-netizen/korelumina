import path from "path";
import { acquireLock, releaseLock, touchLock } from "./locks";

const STALE_MS = 15 * 60 * 1000; // 15 minutes

function getProjectLockPath(workspaceId: string, projectId: string) {
  return path.resolve(
    "runtime",
    "locks",
    workspaceId,
    `${projectId}.lock`
  );
}

export function acquireProjectLock(
  workspaceId: string,
  projectId: string,
  jobId: string
) {
  const lockPath = getProjectLockPath(workspaceId, projectId);

  return acquireLock(
    lockPath,
    {
      pid: process.pid,
      jobId,
      workspaceId,
      projectId,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    },
    { staleMs: STALE_MS }
  );
}

export function heartbeatProject(workspaceId: string, projectId: string) {
  const lockPath = getProjectLockPath(workspaceId, projectId);
  touchLock(lockPath);
}

export function releaseProjectLock(
  workspaceId: string,
  projectId: string,
  jobId: string
) {
  const lockPath = getProjectLockPath(workspaceId, projectId);
  releaseLock(lockPath, jobId);
}
