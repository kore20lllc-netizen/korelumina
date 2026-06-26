import type { Express } from "express";
import { rm } from "node:fs/promises";

import { getProjectPath } from "../projects/getProjectPath.js";
import { removeProjectMetadata } from "../projects/projectMetadataStore.js";

import {
  listRuntimeProjects,
  getRuntimeProject,
} from "../runtime/projectRegistry.js";

import {
  canViewProject,
  canManageProject,
} from "./runtimeAuthorization.js";

import { getRuntimeCaller } from "./runtimeCaller.js";
import { stopRuntime } from "../runtime/registry.js";
import { requireRuntimeAccess } from "./runtimeAccess.js";

function normalizeProjectId(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function registerProjectsRoute(app: Express) {
  app.get(
    "/api/runtime/projects",
    requireRuntimeAccess,
    (req, res) => {
      const caller = getRuntimeCaller(req);

      const projects = listRuntimeProjects().filter((project) => {
        const record = getRuntimeProject(project.projectId);

        return canViewProject(
          caller,
          record?.metadata ?? null,
        );
      });

      return res.json({
        ok: true,
        projects,
      });
    },
  );

  app.delete(
    "/api/runtime/projects/:projectId",
    requireRuntimeAccess,
    async (req, res) => {
      try {
        const projectId = normalizeProjectId(
          req.params.projectId,
        );

        if (!projectId) {
          return res.status(400).json({
            ok: false,
            error: "missing_projectId",
          });
        }

        const record =
          getRuntimeProject(projectId);

        if (!record) {
          return res.status(404).json({
            ok: false,
            error: "project_not_found",
            projectId,
          });
        }

        const caller =
          getRuntimeCaller(req);

        if (
          !canManageProject(
            caller,
            record.metadata,
          )
        ) {
          return res.status(403).json({
            ok: false,
            error: "forbidden",
            projectId,
          });
        }

        await stopRuntime(projectId);

        await rm(
          getProjectPath(projectId),
          {
            recursive: true,
            force: true,
          },
        );

        removeProjectMetadata(projectId);

        return res.json({
          ok: true,
          deleted: true,
          projectId,
        });
      } catch (error) {
        console.error(
          "[runtime/projects/delete]",
          error,
        );

        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_delete_project",
        });
      }
    },
  );
}
