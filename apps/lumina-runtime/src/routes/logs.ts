import type { Express } from "express";

import {
  getRuntime,
  serializeRuntime,
} from "../runtime/registry";

export function registerLogsRoute(
  app: Express,
) {
  app.get(
    "/api/runtime/logs",
    (req, res) => {
      try {
        const projectId =
          req.query.projectId as string;

        if (!projectId) {
          return res.status(400).json({
            ok: false,
            error: "missing_projectId",
          });
        }

        const runtime =
          getRuntime(projectId);

        if (!runtime) {
          return res.status(404).json({
            ok: false,
            error: "runtime_not_found",
          });
        }

        return res.json({
          ok: true,
          runtime:
            serializeRuntime(
              runtime,
            ),
          logs:
            runtime.logs,
        });
      } catch (error) {
        console.error(error);

        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_get_logs",
        });
      }
    },
  );
}
