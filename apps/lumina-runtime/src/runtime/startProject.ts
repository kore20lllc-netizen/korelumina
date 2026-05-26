import fs from "node:fs";
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
} from "./registry";
import { waitForRuntime } from "./waitForRuntime";

const pendingStarts =
  new Map<string, Promise<ReturnType<typeof serializeRuntime>>>();

export async function startProject(
  projectId: string,
) {
  const existing =
    getRuntime(projectId);

  if (existing) {
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

async function startProjectInternal(
  projectId: string,
) {
  const projectPath =
    getProjectPath(projectId);

  console.log(
    "[runtime] projectPath =",
    projectPath,
  );

  if (
    !fs.existsSync(projectPath)
  ) {
    throw new Error(
      `Project not found: ${projectPath}`,
    );
  }

  ensureProjectIsolation(
    projectPath,
  );

  const framework =
    detectFramework(projectPath);

  console.log(
    "[runtime] framework =",
    framework,
  );

  if (
    framework === "unknown"
  ) {
    throw new Error(
      "Unsupported framework",
    );
  }

  const port =
    await getPort({
      port: Array.from(
        { length: 100 },
        (_, i) => 4200 + i,
      ),
    });

  const command =
    framework === "next"
      ? [
          "run",
          "dev",
          "--",
          "--hostname",
          "0.0.0.0",
          "--port",
          String(port),
        ]
      : [
          "run",
          "dev",
          "--",
          "--host",
          "0.0.0.0",
          "--port",
          String(port),
        ];

  const proc =
    spawn("npm", command, {
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
        PORT: String(port),
        FORCE_COLOR: "1",
      },
    });

  const runtime =
    setRuntime({
      projectId,
      framework,
      port,
      pid: proc.pid,
      startedAt: Date.now(),
      url: `http://localhost:${port}`,
      process: proc,
      logs: [],
      status: "starting",
    });

  proc.stdout?.on(
    "data",
    (chunk) => {
      const text =
        chunk.toString();

      process.stdout.write(text);

      for (const line of text.split(
        "\n",
      )) {
        if (line.trim()) {
          appendRuntimeLog(
            projectId,
            line,
          );
        }
      }
    },
  );

  proc.stderr?.on(
    "data",
    (chunk) => {
      const text =
        chunk.toString();

      process.stderr.write(text);

      for (const line of text.split(
        "\n",
      )) {
        if (line.trim()) {
          appendRuntimeLog(
            projectId,
            line,
          );
        }
      }
    },
  );

  proc.on("error", (error) => {
    console.error(
      "[runtime] spawn error:",
      error,
    );

    runtime.status = "error";
    appendRuntimeLog(
      projectId,
      `[spawn error] ${error.message}`,
    );

    removeRuntime(projectId);
  });

  proc.on("exit", (code, signal) => {
    console.log(
      `[runtime] exited ${projectId} with code ${code} signal ${signal}`,
    );

    runtime.status = "exited";
    appendRuntimeLog(
      projectId,
      `[exit] code=${code} signal=${signal}`,
    );

    removeRuntime(projectId);
  });

  try {
    await waitForRuntime(
      runtime.url,
    );

    runtime.status =
      "running";

    console.log(
      "[runtime] ready:",
      runtime.url,
    );

    return serializeRuntime(
      runtime,
    );
  } catch (error) {
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

    removeRuntime(projectId);

    throw error;
  }
}
