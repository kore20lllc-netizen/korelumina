import type { Express } from "express";
import { callerMayViewProject, requireProjectAccess } from "./projectAccess.js";
import { getRuntimeCaller } from "./runtimeCaller.js";

import {
  getRuntime,
  listRuntimes,
  serializeRuntime,
} from "../runtime/registry.js";

import {
  projectExists,
} from "../runtime/projectRegistry.js";

function runtimeStatusResponse(projectId: string) {
  if (!projectExists(projectId)) {
    return {
      status: 404,
      body: {
        ok: false,
        running: false,
        error: "project_not_found",
        projectId,
      },
    };
  }

  const runtime = getRuntime(projectId);

  if (!runtime) {
    return {
      status: 404,
      body: {
        ok: false,
        running: false,
        error: "runtime_not_found",
        projectId,
      },
    };
  }

  const publicRuntime = serializeRuntime(runtime);

  return {
    status: 200,
    body: {
      ok: true,
      running: publicRuntime.status === "running",
      ...publicRuntime,
      runtime: publicRuntime,
    },
  };
}

export function registerStatusRoute(app: Express) {
  app.get("/api/runtime/status", requireProjectAccess("view"), (req, res) => {
    try {
      const projectId =
        typeof req.query.projectId === "string"
          ? req.query.projectId
          : undefined;

      if (!projectId) {
        /* F-47: only the runtimes of projects the caller may see. */
        const caller = getRuntimeCaller(req);
        const runtimes =
          listRuntimes()
            .map(serializeRuntime)
            .filter((runtime) => callerMayViewProject(caller, runtime.projectId));

        return res.json({
          ok: true,
          running: runtimes.some(
            (runtime) =>
              runtime.status === "running",
          ),
          runtimes,
        });
      }

      const result =
        runtimeStatusResponse(projectId);

      return res
        .status(result.status)
        .json(result.body);
    } catch (error) {
      console.error(
        "[runtime/status]",
        error,
      );

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_get_status",
      });
    }
  });

  app.get(
    "/api/runtime/status/:projectId",
    requireProjectAccess("view"),
    (req, res) => {
      try {
        const result =
          runtimeStatusResponse(
            String(req.params.projectId),
          );

        return res
          .status(result.status)
          .json(result.body);
      } catch (error) {
        console.error(
          "[runtime/status/:projectId]",
          error,
        );

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
