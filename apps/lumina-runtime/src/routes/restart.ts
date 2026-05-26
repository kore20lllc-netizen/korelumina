import type { Express } from "express";

import { stopRuntime } from "../runtime/registry";
import { startProject } from "../runtime/startProject";

export function registerRestartRoute(
  app: Express,
) {
  app.post(
    "/api/runtime/restart",
    async (req, res) => {
      try {
        const projectId =
          req.body?.projectId;

        if (!projectId) {
          return res.status(400).json({
            ok: false,
            error: "missing_projectId",
          });
        }

        await stopRuntime(
          projectId,
        );

        const runtime =
          await startProject(
            projectId,
          );

        return res.json({
          ok: true,
          restarted: true,
          runtime,
        });
      } catch (error) {
        console.error(error);

        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_restart_runtime",
        });
      }
    },
  );
}
