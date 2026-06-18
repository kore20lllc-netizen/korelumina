import type { Express } from "express";

import { startProject } from "../runtime/startProject.js";
import { requireRuntimeAccess } from "./runtimeAccess.js";

export function registerStartRoute(app: Express) {
  app.post("/api/runtime/start", requireRuntimeAccess, async (req, res) => {
    try {
      const projectId =
        typeof req.body?.projectId === "string"
          ? req.body.projectId.trim()
          : "";

      if (!projectId) {
        return res.status(400).json({
          ok: false,
          error: "missing_projectId",
        });
      }

      if (!/^[a-zA-Z0-9._-]+$/.test(projectId)) {
        return res.status(400).json({
          ok: false,
          error: "invalid_projectId",
        });
      }

      const runtime = await startProject(projectId);

      return res.json({
        ok: true,
        runtime,
      });
    } catch (error) {
      console.error("[runtime/start]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_start_runtime",
      });
    }
  });
}
