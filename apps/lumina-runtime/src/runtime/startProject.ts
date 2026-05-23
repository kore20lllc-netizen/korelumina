import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import getPort from "get-port";

const runtimeRegistry = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
  /apps/lumina-runtime/src/runtime
  -> go back to repo root
*/
const REPO_ROOT = path.resolve(
  __dirname,
  "../../../..",
);

export async function startProject(projectId: string) {
  const existing =
    runtimeRegistry.get(projectId);

  if (existing) {
    return existing;
  }

  const port = await getPort({
    port: Array.from(
      { length: 100 },
      (_, i) => 4200 + i,
    ),
  });

  const builderPath = path.join(
    REPO_ROOT,
    "apps",
    "lumina-builder",
  );

  console.log(
    "[runtime] builderPath =",
    builderPath,
  );

  const proc = spawn(
    process.platform === "win32"
      ? "npm.cmd"
      : "npm",
    [
      "run",
      "dev",
      "--",
      "--host",
      "0.0.0.0",
      "--port",
      String(port),
    ],
    {
      cwd: builderPath,
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(port),
      },
    },
  );

  proc.on("error", (error) => {
    console.error(
      "[runtime] spawn error:",
      error,
    );

    runtimeRegistry.delete(projectId);
  });

  proc.on("exit", (code) => {
    console.log(
      `[runtime] ${projectId} exited with code ${code}`,
    );

    runtimeRegistry.delete(projectId);
  });

  const runtime = {
    projectId,
    port,
    pid: proc.pid,
    startedAt: Date.now(),
    url: `http://localhost:${port}`,
  };

  runtimeRegistry.set(
    projectId,
    runtime,
  );

  return runtime;
}

export async function getProjectRuntime(
  projectId: string,
) {
  return (
    runtimeRegistry.get(projectId) || null
  );
}
