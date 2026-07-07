import {
  markRuntimeManuallyStopped,
  clearRuntimeManuallyStopped,
  isRuntimeManuallyStopped,
} from "@/services/runtime/manualStop";

const MANUAL_RUNTIME_STOP_PREFIX =
  "lumina:runtime-manual-stop:";

const manuallyStoppedRuntimes =
  new Set<string>();

function manualStopKey(
  projectId: string,
) {
  return `${MANUAL_RUNTIME_STOP_PREFIX}${projectId}`;
}

export function markRuntimeManuallyStopped(
  projectId: string,
) {
  manuallyStoppedRuntimes.add(projectId);
}

export function clearRuntimeManuallyStopped(
  projectId: string,
) {
  manuallyStoppedRuntimes.delete(projectId);

  try {
    localStorage.removeItem(
      manualStopKey(projectId),
    );
  } catch {
    // ignore
  }
}

export function isRuntimeManuallyStopped(
  projectId: string,
) {
  return manuallyStoppedRuntimes.has(projectId);
}
