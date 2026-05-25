import fs from "node:fs";
import { spawn } from "node:child_process";

import getPort from "get-port";

import { detectFramework } from "../detect/detectFramework.js";
import { getProjectPath } from "../projects/getProjectPath.js";
import { ensureProjectIsolation } from "./ensureProjectIsolation.js";
import { getRuntime, removeRuntime, setRuntime } from "./registry.js";
import { waitForRuntime } from "./waitForRuntime.js";

export async function startProject(projectId: string) {
  const existing = getRuntime(projectId);

  if (existing) {
    return {
      projectId: existing.projectId,
      framework: existing.framework,
      port: existing.port,
      pid: existing.pid,
      startedAt: existing.startedAt,
      url: existing.url,
    };
  }

  const projectPath = getProjectPath(projectId);

  console.log("[runtime] projectPath =", projectPath);

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project not found: ${projectPath}`);
  }

  ensureProjectIsolation(projectPath);

  const framework = detectFramework(projectPath);

  console.log("[runtime] framework =", framework);

  if (framework === "unknown") {
    throw new Error("Unsupported framework");
  }

  const port = await getPort({
    port: Array.from({ length: 100 }, (_, i) => 4200 + i),
  });

  const command =
    framework === "next"
      ? ["run", "dev", "--", "--hostname", "0.0.0.0", "--port", String(port)]
      : ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(port)];

  const proc = spawn("npm", command, {
    cwd: projectPath,
    shell: false,
    detached: false,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
    },
  });

  const runtime = {
    projectId,
    framework,
    port,
    pid: proc.pid,
    startedAt: Date.now(),
    url: `http://localhost:${port}`,
    process: proc,
  };

  proc.on("error", (error) => {
    console.error("[runtime] spawn error:", error);
    removeRuntime(projectId);
  });

  proc.on("exit", (code) => {
    console.log(`[runtime] exited ${projectId} with code ${code}`);
    removeRuntime(projectId);
  });

  const ready = await waitForRuntime(runtime.url);

  if (!ready) {
    try {
      proc.kill("SIGTERM");
    } catch {
      // noop
    }

    removeRuntime(projectId);
    throw new Error(`Runtime readiness timeout: ${runtime.url}`);
  }

  setRuntime(runtime);

  console.log("[runtime] ready:", runtime.url);

  return {
    projectId: runtime.projectId,
    framework: runtime.framework,
    port: runtime.port,
    pid: runtime.pid,
    startedAt: runtime.startedAt,
    url: runtime.url,
  };
}
