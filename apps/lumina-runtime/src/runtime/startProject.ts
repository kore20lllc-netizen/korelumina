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

const pendingStarts = new Map<
  string,
  Promise<PublicRuntimeRecord>
>();

const START_TIMEOUT_MS = 45_000;

const MAX_AUTO_RESTARTS = 3;
const AUTO_RESTART_WINDOW_MS = 60_000;
const AUTO_RESTART_DELAY_MS = 1_500;

type RestartState = {
  count: number;
  windowStartedAt: number;
};

type RestartHistory = {
  projectId: string;
  count: number;
  windowStartedAt: number;
  lastRestartAt: number;
  lastRecoveredAt?: number;
  lastFailureReason?: string;
};

const restartHistory =
  new Map<
    string,
    RestartHistory
  >();

const restartState = new Map<
  string,
  RestartState
>();

function assertSafeProjectId(
  projectId: string,
) {
  if (
    !/^[a-zA-Z0-9._-]+$/.test(
      projectId,
    )
  ) {
    throw new Error(
      "invalid_projectId",
    );
  }
}

function assertProjectReady(
  projectPath: string,
) {
  const packageJsonPath =
    path.join(
      projectPath,
      "package.json",
    );

  if (
    !fs.existsSync(projectPath)
  ) {
    throw new Error(
      `project_not_found:${projectPath}`,
    );
  }

  if (
    !fs.existsSync(
      packageJsonPath,
    )
  ) {
    throw new Error(
      "missing_package_json",
    );
  }

  const packageJson =
    JSON.parse(
      fs.readFileSync(
        packageJsonPath,
        "utf8",
      ),
    );

  if (
    !packageJson.scripts?.dev
  ) {
    throw new Error(
      "missing_dev_script",
    );
  }
}

function buildCommand(
  framework: string,
  port: number,
): string[] {
  if (
    framework === "next"
  ) {
    return [
      "run",
      "dev",
      "--",
      "--hostname",
      "0.0.0.0",
      "--port",
      String(port),
    ];
  }

  return [
    "run",
    "dev",
    "--",
    "--host",
    "0.0.0.0",
    "--port",
    String(port),
    "--strictPort",
  ];
}

function shouldAutoRestart(
  projectId: string,
): boolean {
  const now =
    Date.now();

  const current =
    restartState.get(
      projectId,
    );

  if (
    !current ||
    now -
      current.windowStartedAt >
      AUTO_RESTART_WINDOW_MS
  ) {
    restartState.set(
      projectId,
      {
        count: 1,
        windowStartedAt: now,
      },
    );

    restartHistory.set(
      projectId,
      {
        projectId,
        count: 1,
        windowStartedAt: now,
        lastRestartAt: now,
      },
    );

    return true;
  }

  if (
    current.count >=
    MAX_AUTO_RESTARTS
  ) {
    return false;
  }

  current.count += 1;

  const history =
    restartHistory.get(
      projectId,
    );

  if (history) {
    history.count += 1;
    history.lastRestartAt =
      now;
  }

  return true;
}

function clearRestartState(
  projectId: string,
) {
  restartState.delete(
    projectId,
  );
}

function recordRestartHistory(
  projectId: string,
  reason: "manual" | "auto-recovery",
) {
  const now =
    Date.now();

  const existing =
    restartHistory.get(
      projectId,
    );

  restartHistory.set(
    projectId,
    {
      projectId,
      count:
        (existing?.count ?? 0) + 1,
      windowStartedAt:
        existing?.windowStartedAt ?? now,
      lastRestartAt:
        now,
      lastRecoveredAt:
        existing?.lastRecoveredAt,
      lastFailureReason:
        reason,
    },
  );
}


export function getRestartState(
  projectId: string,
) {
  const state =
    restartState.get(
      projectId,
    );

  if (!state) {
    return null;
  }

  return {
    projectId,
    ...state,
  };
}

export function getAllRestartStates() {
  return Array.from(
    restartHistory.values(),
  );
}

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
    buildCommand(
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

  const proc = spawn(
    "npm",
    command,
    {
      cwd: projectPath,
      shell: false,
      detached: true,
      stdio: [
        "ignore",
        "pipe",
        "pipe",
      ],
      env: {
        ...process.env,
        NODE_ENV:
          "development",
        PORT:
          String(port),
        VITE_PORT:
          String(port),
        HOST:
          "0.0.0.0",
        FORCE_COLOR:
          "1",
        BROWSER:
          "none",
      },
    },
  );

  if (proc.pid) {
    acquireRuntimeLock(
      projectId,
      proc.pid,
    );
  }

  recordRuntimeEvent({
    projectId,
    type:
      "runtime_starting",
  });

  const runtime =
    setRuntime({
      projectId,
      framework,
      port,
      pid: proc.pid,
      startedAt:
        Date.now(),
      url: `http://localhost:${port}`,
      process: proc,
      logs: [],
      status:
        "starting",
    });

  appendRuntimeLog(
    projectId,
    `[lumina-runtime] ${
      isAutoRestart
        ? "restarting"
        : "starting"
    } ${projectId}`,
  );

  appendRuntimeLog(
    projectId,
    `[lumina-runtime] framework=${framework}`,
  );

  appendRuntimeLog(
    projectId,
    `[lumina-runtime] url=http://localhost:${port}`,
  );

  proc.stdout?.on(
    "data",
    (chunk) => {
      const text =
        chunk.toString();

      process.stdout.write(
        text,
      );

      appendRuntimeLog(
        projectId,
        text,
      );
    },
  );

  proc.stderr?.on(
    "data",
    (chunk) => {
      const text =
        chunk.toString();

      process.stderr.write(
        text,
      );

      appendRuntimeLog(
        projectId,
        text,
      );
    },
  );

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
      restartHistory.get(
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
      restartHistory.get(
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
