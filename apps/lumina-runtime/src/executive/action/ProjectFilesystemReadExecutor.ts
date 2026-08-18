import fs from "node:fs";
import path from "node:path";

import {
  getProjectPath,
} from "../../projects/getProjectPath.js";

import {
  ensureWithinRoot,
} from "../../projects/workspacePaths.js";

import type {
  ExecutiveActionExecutionContext,
  ExecutiveActionExecutionResult,
  ExecutiveActionExecutor,
} from "./ExecutiveActionExecutor.js";

const DEFAULT_MAX_READ_BYTES =
  1024 * 1024;

export interface ProjectFilesystemReadExecutorOptions {
  maxReadBytes?:
    number;

  resolveProjectPath?:
    (
      projectId: string,
    ) => string;
}

export class ProjectFilesystemReadExecutor
implements ExecutiveActionExecutor {
  readonly name =
    "project-filesystem-read";

  private readonly maxReadBytes:
    number;

  private readonly resolveProjectPath:
    (
      projectId: string,
    ) => string;

  constructor(
    options:
      ProjectFilesystemReadExecutorOptions = {},
  ) {
    this.maxReadBytes =
      options.maxReadBytes ??
      DEFAULT_MAX_READ_BYTES;

    if (
      !Number.isInteger(
        this.maxReadBytes,
      ) ||
      this.maxReadBytes <=
        0
    ) {
      throw new Error(
        "project_filesystem_read_executor_invalid_max_read_bytes",
      );
    }

    this.resolveProjectPath =
      options.resolveProjectPath ??
      getProjectPath;
  }

  execute(
    context:
      ExecutiveActionExecutionContext,
  ): ExecutiveActionExecutionResult {
    if (
      context.operation.type !==
      "filesystem.read"
    ) {
      throw new Error(
        "project_filesystem_read_executor_operation_not_supported",
      );
    }

    const projectIdValue =
      context.action.metadata
        .projectId;

    const projectId =
      typeof projectIdValue ===
        "string"
        ? projectIdValue.trim()
        : "";

    if (!projectId) {
      throw new Error(
        "project_filesystem_read_executor_project_id_required",
      );
    }

    const requestedPath =
      context.operation
        .path
        .trim();

    if (!requestedPath) {
      throw new Error(
        "project_filesystem_read_executor_path_required",
      );
    }

    const projectRoot =
      fs.realpathSync(
        this.resolveProjectPath(
          projectId,
        ),
      );

    const lexicalTarget =
      path.resolve(
        projectRoot,
        requestedPath,
      );

    ensureWithinRoot(
      projectRoot,
      lexicalTarget,
      "project_filesystem_read_path_escape_detected",
    );

    if (
      !fs.existsSync(
        lexicalTarget,
      )
    ) {
      throw new Error(
        "project_filesystem_read_file_not_found",
      );
    }

    const realTarget =
      fs.realpathSync(
        lexicalTarget,
      );

    /*
     * realpath containment is mandatory. This catches both
     * the requested file being a symlink and any symlinked
     * ancestor that escapes the governed project root.
     */
    ensureWithinRoot(
      projectRoot,
      realTarget,
      "project_filesystem_read_symlink_escape_detected",
    );

    const stats =
      fs.statSync(
        realTarget,
      );

    if (
      !stats.isFile()
    ) {
      throw new Error(
        "project_filesystem_read_target_not_file",
      );
    }

    if (
      stats.size >
      this.maxReadBytes
    ) {
      throw new Error(
        "project_filesystem_read_size_limit_exceeded",
      );
    }

    const content =
      fs.readFileSync(
        realTarget,
        "utf8",
      );

    return Object.freeze({
      ok:
        true,

      summary:
        `Read project file "${requestedPath}".`,

      evidence:
        Object.freeze([
          `project:${projectId}`,
          `file:${requestedPath}`,
        ]),

      metadata:
        Object.freeze({
          executor:
            this.name,

          projectId,

          path:
            requestedPath,

          bytes:
            stats.size,

          encoding:
            "utf8",

          content,
        }),
    });
  }
}
