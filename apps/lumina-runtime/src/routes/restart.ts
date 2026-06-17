import type { Express } from "express";

import {
  getRuntime,
} from "../runtime/registry.js";

import {
  restartProject,
} from "../runtime/startProject.js";

function normalizeProjectId(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

export function registerRestartRoute(
  app: Express,
) {
  app.post(
    "/api/runtime/restart",
    async (req, res) => {
      try {
        const projectId =
          normalizeProjectId(
            req.body?.projectId,
          );

        if (!projectId) {
          return res.status(400).json({
            ok: false,
            error: "missing_projectId",
          });
        }

        await restartProject(
          projectId,
        );

        const runtime =
          getRuntime(
            projectId,
          );

        return res.json({
          ok: true,
          restarted: true,
          runtime,
        });
      } catch (error) {
        console.error(
          "[runtime/restart]",
          error,
        );

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
