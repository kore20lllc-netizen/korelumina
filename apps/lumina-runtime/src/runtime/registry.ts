import type { ChildProcess } from "node:child_process";

export type RuntimeStatus =
  | "starting"
  | "running"
  | "stopping"
  | "exited"
  | "error";

export type RuntimeRecord = {
  projectId: string;
  framework: string;
  port: number;
  pid?: number;
  startedAt: number;
  exitedAt?: number;
  url: string;
  process: ChildProcess;
  logs: string[];
  status: RuntimeStatus;
  lastError?: string;
};

export type PublicRuntimeRecord = Omit<RuntimeRecord, "process">;

const runtimeMap = new Map<string, RuntimeRecord>();

const MAX_LOG_LINES = 300;

export function isPidAlive(pid?: number): boolean {
  if (!pid) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function appendRuntimeLog(projectId: string, line: string): void {
  const runtime = runtimeMap.get(projectId);
  if (!runtime) return;

  runtime.logs ??= [];

  const normalized = String(line ?? "")
    .split(/\r?\n/)
    .map((entry) => entry.trimEnd())
    .filter(Boolean);

  runtime.logs.push(...normalized);

  if (runtime.logs.length > MAX_LOG_LINES) {
    runtime.logs.splice(0, runtime.logs.length - MAX_LOG_LINES);
  }
}

export function markRuntimeExited(projectId: string, reason?: string): void {
  const runtime = runtimeMap.get(projectId);
  if (!runtime) return;

  runtime.status = "exited";
  runtime.exitedAt = Date.now();

  if (reason) {
    runtime.lastError = reason;
    appendRuntimeLog(projectId, `[lumina-runtime] exited: ${reason}`);
  }
}

export function serializeRuntime(runtime: RuntimeRecord): PublicRuntimeRecord {
  const alive = isPidAlive(runtime.pid);

  return {
    projectId: runtime.projectId,
    framework: runtime.framework,
    port: runtime.port,
    pid: runtime.pid,
    startedAt: runtime.startedAt,
    exitedAt: runtime.exitedAt,
    url: runtime.url,
    logs: Array.isArray(runtime.logs)
      ? runtime.logs.slice(-MAX_LOG_LINES)
      : [],
    status: alive ? runtime.status : "exited",
    lastError: runtime.lastError,
  };
}

export function setRuntime(runtime: RuntimeRecord): RuntimeRecord {
  runtime.logs ??= [];
  runtime.status ??= "starting";
  runtimeMap.set(runtime.projectId, runtime);
  return runtime;
}

export function getRuntime(projectId: string): RuntimeRecord | null {
  const runtime = runtimeMap.get(projectId);
  if (!runtime) return null;

  if (runtime.pid && !isPidAlive(runtime.pid)) {
    markRuntimeExited(projectId, "process_not_alive");
  }

  return runtime;
}

export function removeRuntime(projectId: string): void {
  runtimeMap.delete(projectId);
}

export function listRuntimes(): RuntimeRecord[] {
  for (const [projectId, runtime] of runtimeMap.entries()) {
    if (runtime.pid && !isPidAlive(runtime.pid)) {
      markRuntimeExited(projectId, "process_not_alive");
    }
  }

  return Array.from(runtimeMap.values());
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killProcess(pid: number | undefined, signal: NodeJS.Signals): void {
  if (!pid) return;

  try {
    process.kill(pid, signal);
  } catch {
    // Process already exited or is inaccessible.
  }
}

export async function stopRuntime(projectId: string): Promise<boolean> {
  const runtime = runtimeMap.get(projectId);
  if (!runtime) return false;

  runtime.status = "stopping";
  appendRuntimeLog(projectId, `[lumina-runtime] stopping runtime ${projectId}`);

  try {
    runtime.process.kill("SIGTERM");
  } catch {
    // Child process may already be gone.
  }

  killProcess(runtime.pid, "SIGTERM");

  await wait(1200);

  if (isPidAlive(runtime.pid)) {
    appendRuntimeLog(projectId, `[lumina-runtime] force killing runtime ${projectId}`);
    killProcess(runtime.pid, "SIGKILL");
  }

  runtime.status = "exited";
  runtime.exitedAt = Date.now();
  runtimeMap.delete(projectId);

  return true;
}

export async function stopAllRuntimes(): Promise<void> {
  await Promise.all(
    listRuntimes().map((runtime) => stopRuntime(runtime.projectId)),
  );
}
