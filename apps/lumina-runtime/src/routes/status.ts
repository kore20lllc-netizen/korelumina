import type { Express } from "express";

import {
  getRuntime,
  listRuntimes,
  serializeRuntime,
} from "../runtime/registry";

export function registerStatusRoute(
  app: Express,
) {
  app.get(
    "/api/runtime/status",
    (req, res) => {
      try {
        const projectId =
          req.query.projectId as string | undefined;

        if (!projectId) {
          const runtimes =
            listRuntimes().map(
              serializeRuntime,
            );

          return res.json({
            ok: true,
            running:
              runtimes.length > 0,
            runtimes,
          });
        }

        const runtime =
          getRuntime(projectId);

        if (!runtime) {
          return res.status(404).json({
            ok: false,
            running: false,
            error: "runtime_not_found",
            projectId,
          });
        }

        const publicRuntime =
          serializeRuntime(runtime);

        return res.json({
          ok: true,
          running:
            publicRuntime.status ===
            "running",
          ...publicRuntime,
          runtime:
            publicRuntime,
        });
      } catch (error) {
        console.error(error);

        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_get_status",
        });
      }
    },
  );
}
