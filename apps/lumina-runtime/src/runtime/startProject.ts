import {
  appendRuntimeLog,
  getRuntime,
  markRuntimeStatus,
  serializeRuntime,
  stopRuntime,
  type PublicRuntimeRecord,
} from "./registry.js";

import {
  coordinateRuntimeStartup,
} from "./startup/RuntimeCoordinator.js";

import {
  recordRestartHistory,
  getRestartState,
  getAllRestartStates,
} from "./startup/RuntimeRestartPolicy.js";

export {
  getRestartState,
  getAllRestartStates,
} from "./startup/RuntimeRestartPolicy.js";

import {
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
  return coordinateRuntimeStartup({
    projectId,
    isAutoRestart,
    restartProject,
  });
}
