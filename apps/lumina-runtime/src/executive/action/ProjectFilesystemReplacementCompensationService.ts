import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  getProjectPath,
} from "../../projects/getProjectPath.js";

import {
  ensureWithinRoot,
} from "../../projects/workspacePaths.js";

import {
  ExecutiveAuditService,
  type ExecutiveAudit,
} from "../audit/index.js";

const DEFAULT_MAX_COMPENSATION_BYTES =
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

export interface ProjectFilesystemReplacementSnapshot {
  readonly encoding:
    "base64";

  readonly content:
    string;

  readonly sha256:
    string;

  readonly bytes:
    number;
}

export interface CompensateProjectFilesystemReplacementInput {
  sessionId:
    string;

  actionId:
    string;

  actorId:
    string;

  projectId:
    string;

  path:
    string;

  expectedCurrentSha256:
    string;

  snapshot:
    ProjectFilesystemReplacementSnapshot;

  executionAuditId:
    string;
}

export interface ProjectFilesystemReplacementCompensationResult {
  readonly restored:
    true;

  readonly projectId:
    string;

  readonly path:
    string;

  readonly replacedSha256:
    string;

  readonly restoredSha256:
    string;

  readonly restoredBytes:
    number;

  readonly audit:
    ExecutiveAudit;
}

export interface ProjectFilesystemReplacementCompensationServiceOptions {
  maxCompensationBytes?:
    number;

  resolveProjectPath?:
    (
      projectId: string,
    ) => string;
}

export class ProjectFilesystemReplacementCompensationService {
  private readonly maxCompensationBytes:
    number;

  private readonly resolveProjectPath:
    (
      projectId: string,
    ) => string;

  constructor(
    private readonly auditService:
      ExecutiveAuditService,

    options:
      ProjectFilesystemReplacementCompensationServiceOptions = {},
  ) {
    this.maxCompensationBytes =
      options.maxCompensationBytes ??
      DEFAULT_MAX_COMPENSATION_BYTES;

    if (
      !Number.isInteger(
        this.maxCompensationBytes,
      ) ||
      this.maxCompensationBytes <=
        0
    ) {
      throw new Error(
        "project_filesystem_compensation_invalid_max_bytes",
      );
    }

    this.resolveProjectPath =
      options.resolveProjectPath ??
      getProjectPath;
  }

  compensate(
    input:
      CompensateProjectFilesystemReplacementInput,
  ): ProjectFilesystemReplacementCompensationResult {
    const sessionId =
      input.sessionId.trim();

    const actionId =
      input.actionId.trim();

    const actorId =
      input.actorId.trim();

    const projectId =
      input.projectId.trim();

    const requestedPath =
      input.path.trim();

    const executionAuditId =
      input.executionAuditId.trim();

    if (!sessionId) {
      throw new Error(
        "project_filesystem_compensation_session_id_required",
      );
    }

    if (!actionId) {
      throw new Error(
        "project_filesystem_compensation_action_id_required",
      );
    }

    if (!actorId) {
      throw new Error(
        "project_filesystem_compensation_actor_id_required",
      );
    }

    if (!projectId) {
      throw new Error(
        "project_filesystem_compensation_project_id_required",
      );
    }

    if (!requestedPath) {
      throw new Error(
        "project_filesystem_compensation_path_required",
      );
    }

    if (!executionAuditId) {
      throw new Error(
        "project_filesystem_compensation_execution_audit_id_required",
      );
    }

    const expectedCurrentSha256 =
      input.expectedCurrentSha256
        .trim()
        .toLowerCase();

    if (
      !/^[a-f0-9]{64}$/.test(
        expectedCurrentSha256,
      )
    ) {
      throw new Error(
        "project_filesystem_compensation_expected_sha256_invalid",
      );
    }

    if (
      input.snapshot.encoding !==
      "base64"
    ) {
      throw new Error(
        "project_filesystem_compensation_snapshot_encoding_invalid",
      );
    }

    const snapshotSha256 =
      input.snapshot.sha256
        .trim()
        .toLowerCase();

    if (
      !/^[a-f0-9]{64}$/.test(
        snapshotSha256,
      )
    ) {
      throw new Error(
        "project_filesystem_compensation_snapshot_sha256_invalid",
      );
    }

    const restoredBytes =
      Buffer.from(
        input.snapshot.content,
        "base64",
      );

    if (
      restoredBytes.length !==
      input.snapshot.bytes
    ) {
      throw new Error(
        "project_filesystem_compensation_snapshot_size_mismatch",
      );
    }

    if (
      restoredBytes.length >
      this.maxCompensationBytes
    ) {
      throw new Error(
        "project_filesystem_compensation_size_limit_exceeded",
      );
    }

    const restoredSha256 =
      sha256(
        restoredBytes,
      );

    if (
      restoredSha256 !==
      snapshotSha256
    ) {
      throw new Error(
        "project_filesystem_compensation_snapshot_hash_mismatch",
      );
    }

    const executionAudit =
      this.auditService.get(
        executionAuditId,
      );

    if (!executionAudit) {
      throw new Error(
        "project_filesystem_compensation_execution_audit_not_found",
      );
    }

    if (
      executionAudit.sessionId !==
      sessionId
    ) {
      throw new Error(
        "project_filesystem_compensation_execution_audit_session_mismatch",
      );
    }

    if (
      executionAudit.metadata.actionId !==
      actionId
    ) {
      throw new Error(
        "project_filesystem_compensation_execution_audit_action_mismatch",
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
      "project_filesystem_compensation_path_escape_detected",
    );

    if (
      !fs.existsSync(
        lexicalTarget,
      )
    ) {
      throw new Error(
        "project_filesystem_compensation_target_not_found",
      );
    }

    const realTarget =
      fs.realpathSync(
        lexicalTarget,
      );

    ensureWithinRoot(
      projectRoot,
      realTarget,
      "project_filesystem_compensation_symlink_escape_detected",
    );

    const stats =
      fs.statSync(
        realTarget,
      );

    if (!stats.isFile()) {
      throw new Error(
        "project_filesystem_compensation_target_not_file",
      );
    }

    const currentBytes =
      fs.readFileSync(
        realTarget,
      );

    const currentSha256 =
      sha256(
        currentBytes,
      );

    /*
     * Compensation may never overwrite a file changed after
     * the governed replacement. The exact post-replacement
     * hash is therefore a mandatory rollback precondition.
     */
    if (
      currentSha256 !==
      expectedCurrentSha256
    ) {
      throw new Error(
        "project_filesystem_compensation_precondition_failed",
      );
    }

    const targetDirectory =
      path.dirname(
        realTarget,
      );

    const tempPath =
      path.join(
        targetDirectory,
        `.${path.basename(realTarget)}.korelumina-compensation-${process.pid}-${crypto.randomUUID()}.tmp`,
      );

    ensureWithinRoot(
      projectRoot,
      tempPath,
      "project_filesystem_compensation_temp_path_escape_detected",
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
          restoredBytes,
        );

        fs.fsyncSync(
          descriptor,
        );
      } finally {
        fs.closeSync(
          descriptor,
        );
      }

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

    const committedBytes =
      fs.readFileSync(
        realTarget,
      );

    if (
      sha256(
        committedBytes,
      ) !==
      restoredSha256
    ) {
      throw new Error(
        "project_filesystem_compensation_postcondition_failed",
      );
    }

    const audit =
      this.auditService.create({
        id:
          `audit:execution-compensated:${actionId}:${Date.now()}`,

        sessionId,

        title:
          `Execution compensated: ${requestedPath}`,

        description:
          `Restored governed project file "${requestedPath}" to its exact pre-replacement bytes.`,

        source:
          "executive-action-execution-compensated",

        ownerId:
          actorId,

        severity:
          "warning",

        status:
          "closed",

        evidence: [
          executionAuditId,
          `project:${projectId}`,
          `file:${requestedPath}`,
          `sha256:replaced:${currentSha256}`,
          `sha256:restored:${restoredSha256}`,
        ],

        metadata: {
          actionId,
          projectId,
          path:
            requestedPath,

          executionAuditId,

          outcome:
            "compensated",

          replacedSha256:
            currentSha256,

          restoredSha256,

          restoredBytes:
            restoredBytes.length,
        },
      });

    return Object.freeze({
      restored:
        true,

      projectId,

      path:
        requestedPath,

      replacedSha256:
        currentSha256,

      restoredSha256,

      restoredBytes:
        restoredBytes.length,

      audit,
    });
  }
}
