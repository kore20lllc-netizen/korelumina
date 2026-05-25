import type { Express } from "express";
import { getRuntime } from "../runtime/registry.js";

export function registerStatusRoute(app: Express) {
  app.get("/api/runtime/status", (req, res) => {
    const projectId = String(req.query.projectId || "");

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
      });
    }

    return res.json({
      ok: true,
      running: true,
      projectId: runtime.projectId,
      framework: runtime.framework,
      port: runtime.port,
      pid: runtime.pid,
      url: runtime.url,
      startedAt: runtime.startedAt,
    });
  });
}
