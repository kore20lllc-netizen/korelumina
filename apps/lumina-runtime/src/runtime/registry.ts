import type { ChildProcess } from "node:child_process";

export type RuntimeInstance = {
  projectId: string;
  port: number;
  url: string;
  process: ChildProcess;
  startedAt: number;
};

const runtimes = new Map<string, RuntimeInstance>();

export function setRuntime(runtime: RuntimeInstance) {
  runtimes.set(runtime.projectId, runtime);
}

export function getRuntime(projectId: string) {
  return runtimes.get(projectId);
}

export function getAllRuntimes() {
  return Array.from(runtimes.values());
}

export function removeRuntime(projectId: string) {
  runtimes.delete(projectId);
}
