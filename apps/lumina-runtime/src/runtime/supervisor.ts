import http from "node:http";
import https from "node:https";

import {
  appendRuntimeLog,
  isPidAlive,
  listRuntimes,
  removeRuntime,
} from "./registry";
import { runtimeState } from "./runtimeState";

const SUPERVISOR_INTERVAL_MS = 5_000;
const HEALTH_TIMEOUT_MS = 2_500;
const STARTUP_GRACE_PERIOD_MS = 30_000;
const MAX_FAILED_HEALTH_CHECKS = 5;

type RuntimeHealthState = {
  failedChecks: number;
  firstFailureAt?: number;
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

      const status = res.statusCode ?? 500;

      resolve(status < 500);
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
  if (sweeping) {
    return;
  }

  sweeping = true;

  try {
    const runtimes = listRuntimes();

    for (const runtime of runtimes) {
      const projectId = runtime.projectId;
      const runtimeAge = Date.now() - runtime.startedAt;

      if (!runtime.pid || !isPidAlive(runtime.pid)) {
        appendRuntimeLog(
          projectId,
          "[lumina-runtime] supervisor detected dead process",
        );

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

      if (runtimeAge < STARTUP_GRACE_PERIOD_MS) {
        continue;
      }

      const healthy = await checkUrl(runtime.url);

      // Update unified state
      runtimeState.updateHealth(projectId, healthy);

      // Keep legacy healthState for backward compatibility
      const current =
        healthState.get(projectId) ?? {
          failedChecks: 0,
          lastCheckedAt: Date.now(),
        };

      current.lastCheckedAt = Date.now();

      if (healthy) {
        current.failedChecks = 0;
        current.firstFailureAt = undefined;

        healthState.set(projectId, current);

        continue;
      }

      current.failedChecks += 1;

      if (!current.firstFailureAt) {
        current.firstFailureAt = Date.now();
      }

      healthState.set(projectId, current);

      appendRuntimeLog(
        projectId,
        `[lumina-runtime] health check failed ${current.failedChecks}/${MAX_FAILED_HEALTH_CHECKS}`,
      );

      if (current.failedChecks < MAX_FAILED_HEALTH_CHECKS) {
        continue;
      }

      runtime.status = "error";
      runtime.lastError = "runtime_health_check_failed";
      runtime.exitedAt = Date.now();

      appendRuntimeLog(projectId, "[lumina-runtime] runtime marked unhealthy");

      try {
        if (runtime.pid) {
          process.kill(-runtime.pid, "SIGTERM");
        } else {
          runtime.process.kill("SIGTERM");
        }
      } catch {
        // Process may already be gone.
      }

      removeRuntime(projectId);
      healthState.delete(projectId);
    }
  } finally {
    sweeping = false;
  }
}

export function startRuntimeSupervisor() {
  if (interval) {
    return;
  }

  interval = setInterval(() => {
    void superviseOnce();
  }, SUPERVISOR_INTERVAL_MS);

  interval.unref();

  console.log("[lumina-runtime] supervisor started");
}

export function stopRuntimeSupervisor() {
  if (!interval) {
    return;
  }

  clearInterval(interval);
  interval = null;
  healthState.clear();

  console.log("[lumina-runtime] supervisor stopped");
}
