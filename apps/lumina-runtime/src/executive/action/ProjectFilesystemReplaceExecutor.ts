import crypto from "node:crypto";
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

const DEFAULT_MAX_REPLACEMENT_BYTES =
  1024 * 1024;

function sha256(
  content: Buffer,
): string {
  return crypto
    .createHash(
      "sha256",
    )
    .update(
      content,
    )
    .digest(
      "hex",
    );
}

export interface ProjectFilesystemReplaceExecutorOptions {
  maxReplacementBytes?:
    number;

  resolveProjectPath?:
    (
      projectId: string,
    ) => string;

  afterAtomicReplace?:
    (
      targetPath: string,
    ) => void;
}

export class ProjectFilesystemReplaceExecutor
implements ExecutiveActionExecutor {
  readonly name =
    "project-filesystem-replace";

  private readonly maxReplacementBytes:
    number;

  private readonly resolveProjectPath:
    (
      projectId: string,
    ) => string;

  private readonly afterAtomicReplace:
    (
      targetPath: string,
    ) => void;

  constructor(
    options:
      ProjectFilesystemReplaceExecutorOptions = {},
  ) {
    this.maxReplacementBytes =
      options.maxReplacementBytes ??
      DEFAULT_MAX_REPLACEMENT_BYTES;

    if (
      !Number.isInteger(
        this.maxReplacementBytes,
      ) ||
      this.maxReplacementBytes <=
        0
    ) {
      throw new Error(
        "project_filesystem_replace_invalid_max_replacement_bytes",
      );
    }

    this.resolveProjectPath =
      options.resolveProjectPath ??
      getProjectPath;

    this.afterAtomicReplace =
      options.afterAtomicReplace ??
      (() => {});
  }

  execute(
    context:
      ExecutiveActionExecutionContext,
  ): ExecutiveActionExecutionResult {
    if (
      context.operation.type !==
      "filesystem.replace"
    ) {
      throw new Error(
        "project_filesystem_replace_operation_not_supported",
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
        "project_filesystem_replace_project_id_required",
      );
    }

    const requestedPath =
      context.operation
        .path
        .trim();

    if (!requestedPath) {
      throw new Error(
        "project_filesystem_replace_path_required",
      );
    }

    const replacementBytes =
      Buffer.from(
        context.operation.content,
        "utf8",
      );

    if (
      replacementBytes.length >
      this.maxReplacementBytes
    ) {
      throw new Error(
        "project_filesystem_replace_size_limit_exceeded",
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
      "project_filesystem_replace_path_escape_detected",
    );

    if (
      !fs.existsSync(
        lexicalTarget,
      )
    ) {
      throw new Error(
        "project_filesystem_replace_target_not_found",
      );
    }

    const realTarget =
      fs.realpathSync(
        lexicalTarget,
      );

    ensureWithinRoot(
      projectRoot,
      realTarget,
      "project_filesystem_replace_symlink_escape_detected",
    );

    const stats =
      fs.statSync(
        realTarget,
      );

    if (
      !stats.isFile()
    ) {
      throw new Error(
        "project_filesystem_replace_target_not_file",
      );
    }

    if (
      stats.size >
      this.maxReplacementBytes
    ) {
      throw new Error(
        "project_filesystem_replace_snapshot_size_limit_exceeded",
      );
    }

    const beforeBytes =
      fs.readFileSync(
        realTarget,
      );

    const beforeSha256 =
      sha256(
        beforeBytes,
      );

    const expectedSha256 =
      context.operation
        .expectedSha256
        .trim()
        .toLowerCase();

    if (
      beforeSha256 !==
      expectedSha256
    ) {
      throw new Error(
        "project_filesystem_replace_precondition_failed",
      );
    }

    const afterSha256 =
      sha256(
        replacementBytes,
      );

    const targetDirectory =
      path.dirname(
        realTarget,
      );

    const tempPath =
      path.join(
        targetDirectory,
        `.${path.basename(realTarget)}.korelumina-${process.pid}-${crypto.randomUUID()}.tmp`,
      );

    ensureWithinRoot(
      projectRoot,
      tempPath,
      "project_filesystem_replace_temp_path_escape_detected",
    );

    let tempCreated =
      false;

    try {
      const descriptor =
        fs.openSync(
          tempPath,
          "wx",
          stats.mode,
        );

      tempCreated =
        true;

      try {
        fs.writeFileSync(
          descriptor,
          replacementBytes,
        );

        fs.fsyncSync(
          descriptor,
        );
      } finally {
        fs.closeSync(
          descriptor,
        );
      }

      /*
       * Preserve the existing file's permission bits.
       * The rename is the only operation that replaces
       * the governed target.
       */
      fs.chmodSync(
        tempPath,
        stats.mode,
      );

      fs.renameSync(
        tempPath,
        realTarget,
      );

      tempCreated =
        false;
    } finally {
      if (
        tempCreated &&
        fs.existsSync(
          tempPath,
        )
      ) {
        fs.rmSync(
          tempPath,
          {
            force:
              true,
          },
        );
      }
    }

    const compensationSnapshot =
      Object.freeze({
        encoding:
          "base64" as const,

        content:
          beforeBytes.toString(
            "base64",
          ),

        sha256:
          beforeSha256,

        bytes:
          beforeBytes.length,
      });

    /*
     * From this point onward the governed target has already
     * changed. Any failure must preserve rollback material and
     * explicitly require compensation.
     */
    try {
      this.afterAtomicReplace(
        realTarget,
      );

      const committedBytes =
        fs.readFileSync(
          realTarget,
        );

      const committedSha256 =
        sha256(
          committedBytes,
        );

      if (
        committedSha256 !==
        afterSha256
      ) {
        throw new Error(
          "project_filesystem_replace_postcondition_failed",
        );
      }
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : String(
              error,
            );

      return Object.freeze({
        ok:
          false,

        reason,

        evidence:
          Object.freeze([
            `project:${projectId}`,
            `file:${requestedPath}`,
            `sha256:before:${beforeSha256}`,
            `sha256:after:${afterSha256}`,
          ]),

        compensationRequired:
          true,

        compensationPlan:
          `Restore exact pre-replacement bytes for "${requestedPath}" from the governed compensation snapshot.`,

        metadata:
          Object.freeze({
            executor:
              this.name,

            projectId,

            path:
              requestedPath,

            bytesBefore:
              beforeBytes.length,

            bytesAfter:
              replacementBytes.length,

            beforeSha256,

            afterSha256,

            atomic:
              true,

            mutationCommitted:
              true,

            compensationRequired:
              true,

            compensationSnapshot,
          }),
      });
    }

    return Object.freeze({
      ok:
        true,

      summary:
        `Replaced governed project file "${requestedPath}".`,

      evidence:
        Object.freeze([
          `project:${projectId}`,
          `file:${requestedPath}`,
          `sha256:before:${beforeSha256}`,
          `sha256:after:${afterSha256}`,
        ]),

      metadata:
        Object.freeze({
          executor:
            this.name,

          projectId,

          path:
            requestedPath,

          bytesBefore:
            beforeBytes.length,

          bytesAfter:
            replacementBytes.length,

          beforeSha256,

          afterSha256,

          atomic:
            true,

          compensationRequired:
            true,

          compensationSnapshot,
        }),
    });
  }
}
