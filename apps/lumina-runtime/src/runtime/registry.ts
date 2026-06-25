import type { ChildProcess } from "node:child_process";

import { persistRuntimeState, removeRuntimeState } from "./persistence.js";
import { publishRuntimeEvent } from "./eventBus.js";
import { unwatchWorkspace } from "./workspaceWatcher.js";
import { runtimeState } from "./runtimeState.js";
import { markRuntimeManualStop } from "./manualStop.js";
import { releaseRuntimeLock } from "./runtimeLock.js";

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

const MAX_LOG_LINES = 300;
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

const ANSI_REGEX =
  // biome-ignore lint/suspicious/noControlCharacters:
  /\u001B\[[0-9;]*[A-Za-z]/g;

const CONTROL_CHAR_REGEX =
  // biome-ignore lint/suspicious/noControlCharacters:
  /[\u0000-\u0008\u000B-\u001F\u007F]/g;

const SECRET_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9]{16,}/g,
  /AIza[0-9A-Za-z\-_]{20,}/g,
  /ghp_[a-zA-Z0-9]{20,}/g,
  /github_pat_[a-zA-Z0-9_]{20,}/g,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g,
];

function publishState(projectId: string, status: RuntimeStatus): void {
  publishRuntimeEvent({
  type: "runtime:state",
  projectId,
  state: status,
  timestamp: Date.now(),
});
}

function sanitizeLogLine(
  value: string,
): string {
  let sanitized = value;

  sanitized =
    sanitized.replace(
      ANSI_REGEX,
      "",
    );

  sanitized =
    sanitized.replace(
      CONTROL_CHAR_REGEX,
      "",
    );

  for (const pattern of SECRET_PATTERNS) {
    sanitized =
      sanitized.replace(
        pattern,
        "[REDACTED]",
      );
  }

  sanitized =
    sanitized.trim();

  if (
    sanitized.length >
    MAX_LOG_LINE_LENGTH
  ) {
    sanitized =
      `${sanitized.slice(
        0,
        MAX_LOG_LINE_LENGTH,
      )}...[truncated]`;
  }

  return sanitized;
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

export function serializeRuntime(
  runtime: RuntimeRecord,
): PublicRuntimeRecord {
  return {
    projectId:
      runtime.projectId,
    framework:
      runtime.framework,
    port:
      runtime.port,
    pid:
      runtime.pid,
    startedAt:
      runtime.startedAt,
    exitedAt:
      runtime.exitedAt,
    lastError:
      runtime.lastError,
    url:
      runtime.url,
    logs:
      Array.isArray(
        runtime.logs,
      )
        ? runtime.logs.slice(
            -MAX_LOG_LINES,
          )
        : [],
    status:
      runtime.status,
  };
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
        sanitizeLogLine,
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
      runtime.status =
        "exited";

      runtime.exitedAt ??=
        Date.now();

      runtime.lastError ??=
        "runtime_process_not_alive";

      persistRecord(runtime);
      publishState(projectId, "exited");
    }
  }

  return Array.from(
    runtimeMap.values(),
  );
}

function wait(
  ms: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        ms,
      );
    },
  );
}

function killProcess(
  pid:
    | number
    | undefined,
  signal: NodeJS.Signals,
): void {
  if (!pid) {
    return;
  }

  try {
    process.kill(
      pid,
      signal,
    );
  } catch {
    // Process already exited.
  }
}

export async function stopRuntime(
  projectId: string,
): Promise<boolean> {
  const runtime =
    runtimeMap.get(
      projectId,
    );

  if (!runtime) {
    return false;
  }

  markRuntimeManualStop(projectId);

  runtime.status =
    "stopping";

  appendRuntimeLog(
    projectId,
    `[lumina-runtime] stopping runtime ${projectId}`,
  );

  try {
    if (runtime.pid) {
      process.kill(
        -runtime.pid,
        "SIGTERM",
      );
    } else {
      runtime.process?.kill(
        "SIGTERM",
      );
    }
  } catch {
    try {
      runtime.process?.kill(
        "SIGTERM",
      );
    } catch {
      // noop
    }
  }

  killProcess(
    runtime.pid,
    "SIGTERM",
  );

  await wait(1200);

  if (
    isPidAlive(
      runtime.pid,
    )
  ) {
    appendRuntimeLog(
      projectId,
      `[lumina-runtime] force killing runtime ${projectId}`,
    );

    try {
      if (runtime.pid) {
        process.kill(
          -runtime.pid,
          "SIGKILL",
        );
      }
    } catch {
      // noop
    }

    killProcess(
      runtime.pid,
      "SIGKILL",
    );
  }

  runtime.status =
    "exited";

  runtime.exitedAt =
    Date.now();

  runtimeMap.delete(
    projectId,
  );

  void unwatchWorkspace(projectId);

  removeRuntimeState(projectId);
  publishState(projectId, "exited");

  return true;
}

export async function stopAllRuntimes(): Promise<void> {
  const runtimes =
    listRuntimes();

  await Promise.all(
    runtimes.map(
      (runtime) =>
        stopRuntime(
          runtime.projectId,
        ),
    ),
  );
}
