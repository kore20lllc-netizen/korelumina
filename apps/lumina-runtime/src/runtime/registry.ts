import type { ChildProcess } from "node:child_process";

import {
  MAX_LOG_LINES,
  sanitizeRuntimeLogLine,
} from "./registry/RuntimeSerializer.js";

export {
  serializeRuntime,
} from "./registry/RuntimeSerializer.js";

export {
  stopRuntime,
  stopAllRuntimes,
} from "./registry/RuntimeLifecycle.js";

import { persistRuntimeState, removeRuntimeState } from "./persistence.js";
import { publishRuntimeEvent } from "./eventBus.js";
import { unwatchWorkspace } from "./workspaceWatcher.js";
import { runtimeState } from "./runtimeState.js";
import { markRuntimeManualStop } from "./manualStop.js";
import { releaseRuntimeLock } from "./runtimeLock.js";
import {
  recordRuntimeEvent,
} from "../knowledge/runtime/index.js";

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
  lastError?: string;
  url: string;
  process?: ChildProcess;
  logs: string[];
  status: RuntimeStatus;
};

export type PublicRuntimeRecord = Omit<
  RuntimeRecord,
  "process"
>;

const runtimeMap = new Map<
  string,
  RuntimeRecord
>();


const MAX_LOG_LINE_LENGTH = 4000;


function persistRecord(runtime: RuntimeRecord): void {
  persistRuntimeState({
    projectId: runtime.projectId,
    framework: runtime.framework,
    port: runtime.port,
    pid: runtime.pid,
    startedAt: runtime.startedAt,
    exitedAt: runtime.exitedAt,
    lastError: runtime.lastError,
    url: runtime.url,
    status: runtime.status,
  });
}

function publishState(
  projectId: string,
  status: RuntimeStatus,
): void {
  publishRuntimeEvent({
    type: "runtime:state",
    projectId,
    state: status,
    timestamp: Date.now(),
  });
}


export function isPidAlive(
  pid?: number,
): boolean {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function appendRuntimeLog(
  projectId: string,
  line: string,
): void {
  const runtime =
    runtimeMap.get(
      projectId,
    );

  if (!runtime) {
    return;
  }

  if (
    !Array.isArray(
      runtime.logs,
    )
  ) {
    runtime.logs = [];
  }

  const normalized =
    String(
      line ?? "",
    )
      .split(/\r?\n/)
      .map(
        sanitizeRuntimeLogLine,
      )
      .filter(Boolean);

  runtime.logs.push(
    ...normalized,
  );

  for (const entry of normalized) {
    publishRuntimeEvent({
  type: "runtime:log",
  projectId,
  message: entry,
  timestamp: Date.now(),
});
  }

  if (
    runtime.logs.length >
    MAX_LOG_LINES
  ) {
    runtime.logs.splice(
      0,
      runtime.logs.length -
        MAX_LOG_LINES,
    );
  }
}

export function setRuntime(
  runtime: RuntimeRecord,
): RuntimeRecord {
  runtime.logs ??= [];
  runtime.status ??=
    "starting";

  runtimeMap.set(
    runtime.projectId,
    runtime,
  );

  // Initialize unified state
  runtimeState.initState(runtime.projectId, runtime.status);

  persistRecord(runtime);
  publishState(runtime.projectId, runtime.status);

  return runtime;
}

export function getRuntime(
  projectId: string,
): RuntimeRecord | null {
  const runtime =
    runtimeMap.get(
      projectId,
    );

  if (!runtime) {
    return null;
  }

  if (
    runtime.pid &&
    !isPidAlive(
      runtime.pid,
    )
  ) {
    runtime.status =
      "exited";

    runtimeMap.delete(
      projectId,
    );

    return null;
  }

  return runtime;
}

export function removeRuntime(
  projectId: string,
): void {
  runtimeMap.delete(
    projectId,
  );

  void unwatchWorkspace(projectId);

  releaseRuntimeLock(projectId);

  // Remove unified state
  runtimeState.removeState(projectId);

  removeRuntimeState(projectId);
  publishState(projectId, "exited");
}


export function markRuntimeStatus(
  projectId: string,
  status: RuntimeStatus,
  options?: {
    exitedAt?: number;
    lastError?: string;
  },
): RuntimeRecord | null {
  const runtime =
    runtimeMap.get(projectId);

  if (!runtime) {
    return null;
  }

  runtime.status = status;

  if (options?.exitedAt !== undefined) {
    runtime.exitedAt =
      options.exitedAt;
  }

  if (options?.lastError !== undefined) {
    runtime.lastError =
      options.lastError;
  }

  runtimeState.initState(
    projectId,
    status,
  );

  persistRecord(runtime);
  publishState(
    projectId,
    status,
  );

  return runtime;
}

export function listRuntimes(): RuntimeRecord[] {
  for (const [
    projectId,
    runtime,
  ] of runtimeMap.entries()) {
    if (
      runtime.pid &&
      !isPidAlive(
        runtime.pid,
      )
    ) {
      markRuntimeStatus(
        projectId,
        "exited",
        {
          exitedAt:
            runtime.exitedAt ??
            Date.now(),
          lastError:
            runtime.lastError ??
            "runtime_process_not_alive",
        },
      );
    }
  }

  return Array.from(
    runtimeMap.values(),
  );
}


