import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import getPort from "get-port";

import { detectFramework } from "../detect/detectFramework";
import { getProjectPath } from "../projects/getProjectPath";
import { ensureProjectIsolation } from "./ensureProjectIsolation";
import {
  appendRuntimeLog,
  getRuntime,
  removeRuntime,
  serializeRuntime,
  setRuntime,
  type PublicRuntimeRecord,
} from "./registry";
import { waitForRuntime } from "./waitForRuntime";
import { watchWorkspace } from "./workspaceWatcher";
import {
  acquireRuntimeLock,
  getRuntimeLock,
  releaseRuntimeLock,
} from "./runtimeLock";

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

    return true;
  }

  if (
    current.count >=
    MAX_AUTO_RESTARTS
  ) {
    return false;
  }

  current.count += 1;

  return true;
}

function clearRestartState(
  projectId: string,
) {
  restartState.delete(
    projectId,
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

async function restartProject(
  projectId: string,
): Promise<void> {
  const pending =
    pendingStarts.get(
      projectId,
    );

  if (pending) {
    return;
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

        runtime.status =
          "error";

        runtime.lastError =
          error instanceof Error
            ? error.message
            : "auto_restart_failed";

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
        runtime.status =
          "error";

        runtime.lastError =
          "auto_restart_limit_reached";

        appendRuntimeLog(
          projectId,
          "[lumina-runtime] auto-restart disabled: limit reached",
        );

        return;
      }

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

    runtime.status =
      "running";

    clearRestartState(
      projectId,
    );

    // Start watching workspace for file changes
    watchWorkspace(projectId, projectPath);

    appendRuntimeLog(
      projectId,
      `[lumina-runtime] ready ${runtime.url}`,
    );

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
