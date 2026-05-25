import type { ChildProcess } from "node:child_process";

export type RuntimeRecord = {
  projectId: string;
  framework: string;
  port: number;
  pid?: number;
  startedAt: number;
  url: string;
  process: ChildProcess;
};

const runtimeMap = new Map<string, RuntimeRecord>();

export function setRuntime(runtime: RuntimeRecord) {
  runtimeMap.set(runtime.projectId, runtime);
  return runtime;
}

export function getRuntime(projectId: string) {
  return runtimeMap.get(projectId) || null;
}

export function removeRuntime(projectId: string) {
  runtimeMap.delete(projectId);
}

export function listRuntimes() {
  return Array.from(runtimeMap.values());
}

export function stopRuntime(projectId: string) {
  const runtime = getRuntime(projectId);

  if (!runtime) {
    return false;
  }

  try {
    runtime.process.kill("SIGTERM");
  } catch {
    // noop
  }

  removeRuntime(projectId);
  return true;
}

export function stopAllRuntimes() {
  for (const runtime of listRuntimes()) {
    try {
      runtime.process.kill("SIGTERM");
    } catch {
      // noop
    }

    removeRuntime(runtime.projectId);
  }
}
