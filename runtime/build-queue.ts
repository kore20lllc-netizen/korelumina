import { spawn } from "child_process";
import pidusage from "pidusage";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import {
  createQueuedJob,
  updateJobStatus
} from "./job-store";

const MAX_MEMORY_MB = 1024;
const MAX_RUNTIME_MS = 1000 * 60 * 10;

export async function enqueueBuild(
  workspaceId: string,
  projectId: string
) {
  return runBuild(workspaceId, projectId);
}

export async function runBuild(
  workspaceId: string,
  projectId: string
) {
  const job = createQueuedJob(workspaceId, projectId, "build");

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);

  const child = spawn("npm", ["run", "build"], {
    cwd: projectRoot,
    shell: true
  });

  const start = Date.now();

  const monitor = setInterval(async () => {
    if (!child.pid) return;

    try {
      const raw = await pidusage(child.pid);

      const stats =
        typeof raw === "object" && "memory" in raw
          ? raw
          : raw[child.pid];

      if (!stats) return;

      const memoryMB = stats.memory / 1024 / 1024;
      const runtime = Date.now() - start;

      if (memoryMB > MAX_MEMORY_MB || runtime > MAX_RUNTIME_MS) {
        child.kill("SIGKILL");
      }
    } catch {
      // ignore monitoring errors
    }
  }, 2000);

  child.on("exit", (code) => {
    clearInterval(monitor);

    if (code === 0) {
      updateJobStatus(job.id, "success");
    } else {
      updateJobStatus(job.id, "failed");
    }
  });

  return job;
}
