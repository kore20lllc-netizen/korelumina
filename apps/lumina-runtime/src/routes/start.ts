import type { Express } from "express";
import { startProject } from "../runtime/startProject.js";

export function registerStartRoute(app: Express) {
  app.post("/api/runtime/start", async (req, res) => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({
          ok: false,
          error: "missing_projectId",
        });
      }

      const runtime = await startProject(projectId);

      return res.json({
        ok: true,
        runtime,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        ok: false,
        error: "runtime_start_failed",
      });
    }
  });
}
