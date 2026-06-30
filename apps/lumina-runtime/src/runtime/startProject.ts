import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import getPort from "get-port";

import { detectFramework } from "../detect/detectFramework.js";
import { getProjectPath } from "../projects/getProjectPath.js";
import { ensureProjectIsolation } from "./ensureProjectIsolation.js";
import {
  appendRuntimeLog,
  getRuntime,
  markRuntimeStatus,
  removeRuntime,
  serializeRuntime,
  setRuntime,
  stopRuntime,
  type PublicRuntimeRecord,
} from "./registry.js";
import { waitForRuntime } from "./waitForRuntime.js";
import {
  assertProjectReady,
} from "./startup/RuntimeStartupValidator.js";
import {
  buildRuntimeCommand,
} from "./startup/RuntimeCommandBuilder.js";
import {
  launchRuntimeProcess,
} from "./startup/RuntimeProcessLauncher.js";
import {
  AUTO_RESTART_DELAY_MS,
  shouldAutoRestart,
  clearRestartState,
  recordRestartHistory,
  getRestartState,
  getAllRestartStates,
  getRestartHistory,
} from "./startup/RuntimeRestartPolicy.js";

export {
  getRestartState,
  getAllRestartStates,
} from "./startup/RuntimeRestartPolicy.js";
import {
  recordRuntimeEvent,
} from "../knowledge/runtime/index.js";
import { watchWorkspace } from "./workspaceWatcher.js";
import { runLayoutSafetyEngine } from "./layoutSafetyEngine.js";
import {
  clearRuntimeManualStop,
  isRuntimeManualStop,
} from "./manualStop.js";
import {
  acquireRuntimeLock,
  getRuntimeLock,
  releaseRuntimeLock,
} from "./runtimeLock.js";

import {
  assertSafeProjectId,
} from "@korelumina/platform-sdk";


const pendingStarts = new Map<
  string,
  Promise<PublicRuntimeRecord>
>();

const START_TIMEOUT_MS = 45_000;

export async function startProject(
  projectId: string,
): Promise<PublicRuntimeRecord> {
  assertSafeProjectId(
    projectId,
  );

  const existingLock =
    getRuntimeLock(
      projectId,
    );

  if (
    existingLock?.pid
  ) {
    try {
      process.kill(
        existingLock.pid,
        0,
      );

      const lockedRuntime =
        getRuntime(
          projectId,
        );

      if (lockedRuntime) {
        return serializeRuntime(
          lockedRuntime,
        );
      }

      throw new Error(
        "runtime_lock_exists",
      );
    } catch {
      releaseRuntimeLock(
        projectId,
      );
    }
  }

  const existing =
    getRuntime(projectId);

  if (
    existing &&
    existing.status ===
      "running"
  ) {
    return serializeRuntime(
      existing,
    );
  }

  const pending =
    pendingStarts.get(
      projectId,
    );

  if (pending) {
    return pending;
  }

  const promise =
    startProjectInternal(
      projectId,
      false,
    ).finally(() => {
      pendingStarts.delete(
        projectId,
      );
    });

  pendingStarts.set(
    projectId,
    promise,
  );

  return promise;
}

export async function restartProject(
  projectId: string,
): Promise<void> {
  recordRestartHistory(
    projectId,
    "manual",
  );

  const pending =
    pendingStarts.get(
      projectId,
    );

  if (pending) {
    return;
  }

  const existing =
    getRuntime(projectId);

  if (existing) {
    await stopRuntime(projectId);
  }

  const promise =
    startProjectInternal(
      projectId,
      true,
    )
      .catch((error) => {
        const runtime =
          getRuntime(
            projectId,
          );

        if (!runtime) {
          return serializeRuntime({
            projectId,
            framework:
              "unknown",
            port: 0,
            startedAt:
              Date.now(),
            url: "",
            process:
              {} as never,
            logs: [],
            status:
              "error",
          });
        }

        const lastError =
          error instanceof Error
            ? error.message
            : "auto_restart_failed";

        markRuntimeStatus(
          projectId,
          "error",
          {
            lastError,
          },
        );

        runtime.lastError =
          lastError;

        appendRuntimeLog(
          projectId,
          `[lumina-runtime] auto-restart failed: ${runtime.lastError}`,
        );

        return serializeRuntime(
          runtime,
        );
      })
      .finally(() => {
        pendingStarts.delete(
          projectId,
        );
      });

  pendingStarts.set(
    projectId,
    promise,
  );

  await promise;
}

async function startProjectInternal(
  projectId: string,
  isAutoRestart = false,
): Promise<PublicRuntimeRecord> {
  const projectPath =
    getProjectPath(
      projectId,
    );

  ensureProjectIsolation(
    projectPath,
  );

  runLayoutSafetyEngine(projectId, projectPath);

  assertProjectReady(
    projectPath,
  );

  const framework =
    detectFramework(
      projectPath,
    );

  if (
    framework ===
    "unknown"
  ) {
    throw new Error(
      "unsupported_framework",
    );
  }

  const port =
    await getPort({
      port: Array.from(
        {
          length: 200,
        },
        (_, i) =>
          4200 + i,
      ),
    });

  const command =
    buildRuntimeCommand(
      framework,
      port,
    );

  console.log(
    "[runtime/start]",
    {
      projectId,
      framework,
      port,
      projectPath,
      autoRestart:
        isAutoRestart,
      command: [
        "npm",
        ...command,
      ].join(" "),
    },
  );

  const {
    proc,
    runtime,
  } =
    launchRuntimeProcess({
      projectId,
      framework,
      port,
      projectPath,
      command,
      isAutoRestart,
    });


  proc.on(
    "error",
    (error) => {
      runtime.status =
        "error";

      runtime.lastError =
        error.message;

      appendRuntimeLog(
        projectId,
        `[spawn error] ${error.message}`,
      );

      removeRuntime(
        projectId,
      );
    },
  );

  proc.on(
    "exit",
    (
      code,
      signal,
    ) => {
      runtime.status =
        "exited";

      runtime.exitedAt =
        Date.now();

      runtime.lastError =
        `process_exit code=${code} signal=${signal}`;

      appendRuntimeLog(
        projectId,
        `[exit] code=${code} signal=${signal}`,
      );

      console.log(
        "[runtime/exit]",
        {
          projectId,
          code,
          signal,
          pid: runtime.pid,
          status: runtime.status,
        },
      );

      if (
        isRuntimeManualStop(projectId)
      ) {
        clearRuntimeManualStop(projectId);

        removeRuntime(
          projectId,
        );

        return;
      }

      const intentionalStop =
        signal ===
          "SIGTERM" ||
        signal ===
          "SIGKILL";

      if (
        intentionalStop
      ) {
        removeRuntime(
          projectId,
        );

        return;
      }

      if (
        !shouldAutoRestart(
          projectId,
        )
      ) {
        markRuntimeStatus(
          projectId,
          "error",
          {
            lastError:
              "auto_restart_limit_reached",
          },
        );

        runtime.lastError =
          "auto_restart_limit_reached";

        appendRuntimeLog(
          projectId,
          "[lumina-runtime] auto-restart disabled: limit reached",
        );

        return;
      }

      recordRestartHistory(
        projectId,
        "auto-recovery",
      );

      appendRuntimeLog(
        projectId,
        `[lumina-runtime] auto-restart scheduled in ${AUTO_RESTART_DELAY_MS}ms`,
      );

      setTimeout(() => {
        void restartProject(
          projectId,
        );
      }, AUTO_RESTART_DELAY_MS).unref();
    },
  );

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

    // Start watching workspace for file changes
    watchWorkspace(projectId, projectPath);

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
