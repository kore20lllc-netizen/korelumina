import type { Express } from "express";

import {
  getRuntime,
  stopRuntime,
} from "../runtime/registry.js";

import { getRuntimeProject } from "../runtime/projectRegistry.js";

function normalizeProjectId(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function registerStopRoute(app: Express) {
  app.post("/api/runtime/stop", async (req, res) => {
    try {
      const projectId = normalizeProjectId(
        req.body?.projectId,
      );

      if (!projectId) {
        return res.status(400).json({
          ok: false,
          error: "missing_projectId",
        });
      }

      // Route-level project lookup now goes through the Runtime Project Registry façade.
      // Runtime lifecycle state remains owned by registry.ts.
      getRuntimeProject(projectId);

      const runtime = getRuntime(projectId);

      if (!runtime) {
        return res.status(404).json({
          ok: false,
          error: "runtime_not_found",
          projectId,
        });
      }

      await stopRuntime(projectId);

      return res.json({
        ok: true,
        stopped: true,
        projectId,
      });
    } catch (error) {
      console.error(
        "[runtime/stop]",
        error,
      );

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_stop_runtime",
      });
    }
  });
}
