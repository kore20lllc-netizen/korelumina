import type { Express } from "express";

import {
  getRuntime,
  serializeRuntime,
} from "../runtime/registry.js";

export function registerLogsRoute(app: Express) {
  app.get("/api/runtime/logs", (req, res) => {
    try {
      const projectId =
        typeof req.query.projectId === "string"
          ? req.query.projectId.trim()
          : "";

      if (!projectId) {
        return res.status(400).json({
          ok: false,
          error: "missing_projectId",
        });
      }

      const runtime = getRuntime(projectId);

      if (!runtime) {
        return res.status(404).json({
          ok: false,
          error: "runtime_not_found",
          projectId,
          logs: [],
        });
      }

      const publicRuntime = serializeRuntime(runtime);

      return res.json({
        ok: true,
        projectId,
        runtime: publicRuntime,
        logs: publicRuntime.logs,
      });
    } catch (error) {
      console.error("[runtime/logs]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_get_logs",
      });
    }
  });
}
