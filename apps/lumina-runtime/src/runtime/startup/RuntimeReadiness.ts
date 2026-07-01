import type {
  ChildProcess,
} from "node:child_process";

import {
  appendRuntimeLog,
  markRuntimeStatus,
  serializeRuntime,
  type PublicRuntimeRecord,
  type RuntimeRecord,
} from "../registry.js";

import {
  waitForRuntime,
} from "../waitForRuntime.js";

import {
  watchWorkspace,
} from "../workspaceWatcher.js";

import {
  releaseRuntimeLock,
} from "../runtimeLock.js";

import {
  recordRuntimeEvent,
} from "../../knowledge/runtime/index.js";

import {
  clearRestartState,
  getRestartHistory,
} from "./RuntimeRestartPolicy.js";

const START_TIMEOUT_MS = 45_000;

export async function finalizeRuntimeStartup({
  projectId,
  projectPath,
  proc,
  runtime,
}: {
  projectId: string;
  projectPath: string;
  proc: ChildProcess;
  runtime: RuntimeRecord;
}): Promise<PublicRuntimeRecord> {
  try {
    await waitForRuntime(
      runtime.url,
      START_TIMEOUT_MS,
    );

    markRuntimeStatus(
      projectId,
      "running",
    );

    recordRuntimeEvent({
      projectId,
      type:
        "runtime_started",
    });

    const history =
      getRestartHistory(
        projectId,
      );

    if (history) {
      history.lastRecoveredAt =
        Date.now();
    }

    clearRestartState(
      projectId,
    );

    watchWorkspace(
      projectId,
      projectPath,
    );

    appendRuntimeLog(
      projectId,
      `[lumina-runtime] ready ${runtime.url}`,
    );

    recordRuntimeEvent({
      projectId,
      type:
        "runtime_ready",
      metadata: {
        url: runtime.url,
        port: runtime.port,
      },
    });

    return serializeRuntime(
      runtime,
    );
  } catch (error) {
    runtime.status =
      "error";

    runtime.exitedAt =
      Date.now();

    runtime.lastError =
      error instanceof Error
        ? error.message
        : "runtime_start_timeout";

    const history =
      getRestartHistory(
        projectId,
      );

    if (history) {
      history.lastFailureReason =
        runtime.lastError;
    }

    appendRuntimeLog(
      projectId,
      `[lumina-runtime] failed ${runtime.lastError}`,
    );

    releaseRuntimeLock(
      projectId,
    );

    try {
      if (proc.pid) {
        process.kill(
          -proc.pid,
          "SIGTERM",
        );
      } else {
        proc.kill(
          "SIGTERM",
        );
      }
    } catch {
      // noop
    }

    throw error;
  }
}
