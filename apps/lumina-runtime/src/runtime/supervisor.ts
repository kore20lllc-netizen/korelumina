import http from "node:http";
import https from "node:https";

import {
  appendRuntimeLog,
  isPidAlive,
  listRuntimes,
  removeRuntime,
} from "./registry";

const SUPERVISOR_INTERVAL_MS = 5_000;
const HEALTH_TIMEOUT_MS = 2_500;
const MAX_FAILED_HEALTH_CHECKS = 3;

type RuntimeHealthState = {
  failedChecks: number;
  lastCheckedAt: number;
};

const healthState = new Map<string, RuntimeHealthState>();

let interval: NodeJS.Timeout | null = null;
let sweeping = false;

function checkUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = url.startsWith("https://") ? https : http;

    const req = client.get(url, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });

    req.setTimeout(HEALTH_TIMEOUT_MS, () => {
      req.destroy();
      resolve(false);
    });

    req.on("error", () => {
      resolve(false);
    });
  });
}

async function superviseOnce() {
  if (sweeping) return;
  sweeping = true;

  try {
    const runtimes = listRuntimes();

    for (const runtime of runtimes) {
      const projectId = runtime.projectId;

      if (!runtime.pid || !isPidAlive(runtime.pid)) {
        appendRuntimeLog(projectId, "[lumina-runtime] supervisor detected dead process");
        runtime.status = "exited";
        runtime.exitedAt = Date.now();
        runtime.lastError = "supervisor_process_not_alive";
        removeRuntime(projectId);
        healthState.delete(projectId);
        continue;
      }

      if (runtime.status !== "running") {
        continue;
      }

      const healthy = await checkUrl(runtime.url);
      const current =
        healthState.get(projectId) ?? {
          failedChecks: 0,
          lastCheckedAt: Date.now(),
        };

      current.lastCheckedAt = Date.now();
      current.failedChecks = healthy ? 0 : current.failedChecks + 1;
      healthState.set(projectId, current);

      if (!healthy) {
        appendRuntimeLog(
          projectId,
          `[lumina-runtime] supervisor health check failed ${current.failedChecks}/${MAX_FAILED_HEALTH_CHECKS}`,
        );
      }

      if (current.failedChecks >= MAX_FAILED_HEALTH_CHECKS) {
        runtime.status = "error";
        runtime.lastError = "runtime_health_check_failed";
        runtime.exitedAt = Date.now();

        appendRuntimeLog(projectId, "[lumina-runtime] supervisor marked runtime unhealthy");

        try {
          if (runtime.pid) {
            process.kill(-runtime.pid, "SIGTERM");
          }
        } catch {
          try {
            runtime.process.kill("SIGTERM");
          } catch {
            // Process may already be gone.
          }
        }

        removeRuntime(projectId);
        healthState.delete(projectId);
      }
    }
  } finally {
    sweeping = false;
  }
}

export function startRuntimeSupervisor() {
  if (interval) return;

  interval = setInterval(() => {
    void superviseOnce();
  }, SUPERVISOR_INTERVAL_MS);

  interval.unref();

  console.log("[lumina-runtime] supervisor started");
}

export function stopRuntimeSupervisor() {
  if (!interval) return;

  clearInterval(interval);
  interval = null;
  healthState.clear();

  console.log("[lumina-runtime] supervisor stopped");
}
