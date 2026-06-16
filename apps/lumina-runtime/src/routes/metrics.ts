import type { Express } from "express";

import { getRuntimeEventClientCount } from "../runtime/eventBus.js";
import { getWorkspaceWatcherCount } from "../runtime/workspaceWatcher.js";

import {
  isPidAlive,
  listRuntimes,
  serializeRuntime,
} from "../runtime/registry.js";

import {
  getAllRestartStates,
} from "../runtime/startProject.js";

function getMemoryMb() {
  const usage = process.memoryUsage();

  return {
    rssMb: Math.round(usage.rss / 1024 / 1024),
    heapUsedMb: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(usage.heapTotal / 1024 / 1024),
    externalMb: Math.round(usage.external / 1024 / 1024),
  };
}

export function registerMetricsRoute(app: Express) {
  app.get("/api/runtime/metrics", (_req, res) => {
    try {
      const runtimes = listRuntimes().map((runtime) => {
        const publicRuntime = serializeRuntime(runtime);
        const now = Date.now();

        return {
          projectId: publicRuntime.projectId,
          framework: publicRuntime.framework,
          status: publicRuntime.status,
          port: publicRuntime.port,
          pid: publicRuntime.pid,
          url: publicRuntime.url,
          alive: isPidAlive(publicRuntime.pid),
          uptimeMs: publicRuntime.startedAt
            ? now - publicRuntime.startedAt
            : 0,
          startedAt: publicRuntime.startedAt,
          exitedAt: publicRuntime.exitedAt ?? null,
          lastError: publicRuntime.lastError ?? null,
          logLines: publicRuntime.logs.length,
        };
      });

      return res.json({
        ok: true,
        service: "lumina-runtime",
        timestamp: Date.now(),
        process: {
          pid: process.pid,
          uptimeMs: Math.round(process.uptime() * 1000),
          memory: getMemoryMb(),
        },
        totals: {
          eventClients: getRuntimeEventClientCount(),
          workspaceWatchers: getWorkspaceWatcherCount(),
          runtimes: runtimes.length,
          running: runtimes.filter((r) => r.status === "running").length,
          starting: runtimes.filter((r) => r.status === "starting").length,
          exited: runtimes.filter((r) => r.status === "exited").length,
          error: runtimes.filter((r) => r.status === "error").length,
        },
        restarts: getAllRestartStates(),
        runtimes,
      });
    } catch (error) {
      console.error("[runtime/metrics]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_get_metrics",
      });
    }
  });
}
