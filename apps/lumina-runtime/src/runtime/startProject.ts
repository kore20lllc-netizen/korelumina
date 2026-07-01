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
  attachRuntimeLifecycle,
} from "./startup/RuntimeLifecycleBinder.js";
import {
  finalizeRuntimeStartup,
} from "./startup/RuntimeReadiness.js";
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


  attachRuntimeLifecycle({
    proc,
    runtime,
    projectId,
    restartProject,
    removeRuntime,
    appendRuntimeLog,
    markRuntimeStatus,
    isRuntimeManualStop,
    clearRuntimeManualStop,
    shouldAutoRestart,
    recordRestartHistory,
    autoRestartDelayMs:
      AUTO_RESTART_DELAY_MS,
  });

  return finalizeRuntimeStartup({
    projectId,
    projectPath,
    proc,
    runtime,
  });
}
