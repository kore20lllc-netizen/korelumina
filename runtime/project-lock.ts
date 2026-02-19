import { acquireProjectLock, releaseProjectLock } from "./locks";

/**
 * Thin wrapper so older code can keep using projectLock()
 * while internally delegating to the new lock system.
 */

export function acquireLock(workspaceId: string, projectId: string) {
  return acquireProjectLock(workspaceId, projectId);
}

export function releaseLock(release: () => void) {
  releaseProjectLock(release);
}

export function touchLock() {
  // no-op in new lock model
  return;
}
