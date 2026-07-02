import {
  startProject,
  restartProject,
} from "../startProject.js";

import {
  recoverPersistedRuntimes,
} from "../recovery.js";

import {
  stopRuntime,
  stopAllRuntimes,
} from "../registry.js";

export async function startRuntimeLifecycle(
  projectId: string,
) {
  return startProject(projectId);
}

export async function restartRuntimeLifecycle(
  projectId: string,
) {
  return restartProject(projectId);
}

export async function recoverRuntimeLifecycle() {
  return recoverPersistedRuntimes();
}

export async function shutdownRuntimeLifecycle(
  projectId: string,
) {
  return stopRuntime(projectId);
}

export async function shutdownAllRuntimeLifecycles() {
  return stopAllRuntimes();
}
