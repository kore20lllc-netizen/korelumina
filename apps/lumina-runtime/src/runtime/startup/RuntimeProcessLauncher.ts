import { spawn } from "node:child_process";

import {
  appendRuntimeLog,
  setRuntime,
} from "../registry.js";

import {
  acquireRuntimeLock,
} from "../runtimeLock.js";

import {
  recordRuntimeEvent,
} from "../../knowledge/runtime/index.js";

export function launchRuntimeProcess({
  projectId,
  framework,
  port,
  projectPath,
  command,
  isAutoRestart,
}: {
  projectId: string;
  framework: string;
  port: number;
  projectPath: string;
  command: string[];
  isAutoRestart: boolean;
}) {
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
      url:
        `http://localhost:${port}`,
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

  return {
    proc,
    runtime,
  };
}
