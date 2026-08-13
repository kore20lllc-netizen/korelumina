import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ExecutiveAuditService,
} from "../../audit/index.js";

import {
  ProjectFilesystemReplacementCompensationService,
} from "../ProjectFilesystemReplacementCompensationService.js";

function sha256(
  value:
    string | Buffer,
): string {
  return crypto
    .createHash(
      "sha256",
    )
    .update(
      value,
    )
    .digest(
      "hex",
    );
}

function createTempProject() {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "korelumina-compensation-",
      ),
    );

  return {
    root,

    cleanup() {
      fs.rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    },
  };
}

function createExecutionAudit(
  auditService:
    ExecutiveAuditService,
) {
  return auditService.create({
    id:
      "audit:execution-completed:action:test",

    sessionId:
      "session:test",

    title:
      "Execution completed",

    description:
      "Replacement completed.",

    source:
      "executive-action-execution-completed",

    ownerId:
      "agent:test",

    status:
      "closed",

    metadata: {
      actionId:
        "action:test",
    },
  });
}

test(
  "restores exact prior bytes and creates closed compensation audit",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "architecture.md",
        );

      const before =
        Buffer.from([
          0x00,
          0x01,
          0xff,
          0x0a,
        ]);

      const after =
        Buffer.from(
          "replacement",
          "utf8",
        );

      fs.writeFileSync(
        target,
        after,
      );

      const auditService =
        new ExecutiveAuditService();

      const executionAudit =
        createExecutionAudit(
          auditService,
        );

      const service =
        new ProjectFilesystemReplacementCompensationService(
          auditService,
          {
            resolveProjectPath:
              () =>
                project.root,
          },
        );

      const result =
        service.compensate({
          sessionId:
            "session:test",

          actionId:
            "action:test",

          actorId:
            "agent:test",

          projectId:
            "project:test",

          path:
            "architecture.md",

          expectedCurrentSha256:
            sha256(
              after,
            ),

          snapshot: {
            encoding:
              "base64",

            content:
              before.toString(
                "base64",
              ),

            sha256:
              sha256(
                before,
              ),

            bytes:
              before.length,
          },

          executionAuditId:
            executionAudit.id,
        });

      assert.equal(
        result.restored,
        true,
      );

      assert.deepEqual(
        fs.readFileSync(
          target,
        ),
        before,
      );

      assert.equal(
        result.restoredSha256,
        sha256(
          before,
        ),
      );

      assert.equal(
        result.replacedSha256,
        sha256(
          after,
        ),
      );

      assert.equal(
        result.audit.source,
        "executive-action-execution-compensated",
      );

      assert.equal(
        result.audit.status,
        "closed",
      );

      assert.equal(
        result.audit.metadata
          .outcome,
        "compensated",
      );

      assert.ok(
        result.audit.evidence.includes(
          executionAudit.id,
        ),
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "refuses compensation after subsequent file change",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "architecture.md",
        );

      const replaced =
        "replacement";

      const subsequent =
        "new legitimate change";

      fs.writeFileSync(
        target,
        subsequent,
        "utf8",
      );

      const auditService =
        new ExecutiveAuditService();

      const executionAudit =
        createExecutionAudit(
          auditService,
        );

      const service =
        new ProjectFilesystemReplacementCompensationService(
          auditService,
          {
            resolveProjectPath:
              () =>
                project.root,
          },
        );

      assert.throws(
        () =>
          service.compensate({
            sessionId:
              "session:test",

            actionId:
              "action:test",

            actorId:
              "agent:test",

            projectId:
              "project:test",

            path:
              "architecture.md",

            expectedCurrentSha256:
              sha256(
                replaced,
              ),

            snapshot: {
              encoding:
                "base64",

              content:
                Buffer.from(
                  "before",
                ).toString(
                  "base64",
                ),

              sha256:
                sha256(
                  "before",
                ),

              bytes:
                Buffer.byteLength(
                  "before",
                ),
            },

            executionAuditId:
              executionAudit.id,
          }),
        /project_filesystem_compensation_precondition_failed/,
      );

      assert.equal(
        fs.readFileSync(
          target,
          "utf8",
        ),
        subsequent,
      );

      assert.equal(
        auditService.list()
          .filter(
            (audit) =>
              audit.source ===
              "executive-action-execution-compensated",
          )
          .length,
        0,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "tampered snapshot is rejected before mutation",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "architecture.md",
        );

      fs.writeFileSync(
        target,
        "replacement",
        "utf8",
      );

      const auditService =
        new ExecutiveAuditService();

      const executionAudit =
        createExecutionAudit(
          auditService,
        );

      const service =
        new ProjectFilesystemReplacementCompensationService(
          auditService,
          {
            resolveProjectPath:
              () =>
                project.root,
          },
        );

      assert.throws(
        () =>
          service.compensate({
            sessionId:
              "session:test",

            actionId:
              "action:test",

            actorId:
              "agent:test",

            projectId:
              "project:test",

            path:
              "architecture.md",

            expectedCurrentSha256:
              sha256(
                "replacement",
              ),

            snapshot: {
              encoding:
                "base64",

              content:
                Buffer.from(
                  "tampered",
                ).toString(
                  "base64",
                ),

              sha256:
                sha256(
                  "original",
                ),

              bytes:
                Buffer.byteLength(
                  "tampered",
                ),
            },

            executionAuditId:
              executionAudit.id,
          }),
        /project_filesystem_compensation_snapshot_hash_mismatch/,
      );

      assert.equal(
        fs.readFileSync(
          target,
          "utf8",
        ),
        "replacement",
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "compensation audit must belong to same action",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "architecture.md",
        );

      fs.writeFileSync(
        target,
        "replacement",
        "utf8",
      );

      const auditService =
        new ExecutiveAuditService();

      const executionAudit =
        createExecutionAudit(
          auditService,
        );

      const service =
        new ProjectFilesystemReplacementCompensationService(
          auditService,
          {
            resolveProjectPath:
              () =>
                project.root,
          },
        );

      assert.throws(
        () =>
          service.compensate({
            sessionId:
              "session:test",

            actionId:
              "action:other",

            actorId:
              "agent:test",

            projectId:
              "project:test",

            path:
              "architecture.md",

            expectedCurrentSha256:
              sha256(
                "replacement",
              ),

            snapshot: {
              encoding:
                "base64",

              content:
                Buffer.from(
                  "before",
                ).toString(
                  "base64",
                ),

              sha256:
                sha256(
                  "before",
                ),

              bytes:
                Buffer.byteLength(
                  "before",
                ),
            },

            executionAuditId:
              executionAudit.id,
          }),
        /project_filesystem_compensation_execution_audit_action_mismatch/,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "symlink escape is rejected before compensation",
  () => {
    const project =
      createTempProject();

    const outside =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-compensation-outside-",
        ),
      );

    try {
      const outsideFile =
        path.join(
          outside,
          "secret.txt",
        );

      fs.writeFileSync(
        outsideFile,
        "replacement",
        "utf8",
      );

      fs.symlinkSync(
        outsideFile,
        path.join(
          project.root,
          "escape.txt",
        ),
      );

      const auditService =
        new ExecutiveAuditService();

      const executionAudit =
        createExecutionAudit(
          auditService,
        );

      const service =
        new ProjectFilesystemReplacementCompensationService(
          auditService,
          {
            resolveProjectPath:
              () =>
                project.root,
          },
        );

      assert.throws(
        () =>
          service.compensate({
            sessionId:
              "session:test",

            actionId:
              "action:test",

            actorId:
              "agent:test",

            projectId:
              "project:test",

            path:
              "escape.txt",

            expectedCurrentSha256:
              sha256(
                "replacement",
              ),

            snapshot: {
              encoding:
                "base64",

              content:
                Buffer.from(
                  "before",
                ).toString(
                  "base64",
                ),

              sha256:
                sha256(
                  "before",
                ),

              bytes:
                Buffer.byteLength(
                  "before",
                ),
            },

            executionAuditId:
              executionAudit.id,
          }),
        /project_filesystem_compensation_symlink_escape_detected/,
      );

      assert.equal(
        fs.readFileSync(
          outsideFile,
          "utf8",
        ),
        "replacement",
      );
    } finally {
      project.cleanup();

      fs.rmSync(
        outside,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);

test(
  "invalid compensation size configuration is rejected",
  () => {
    assert.throws(
      () =>
        new ProjectFilesystemReplacementCompensationService(
          new ExecutiveAuditService(),
          {
            maxCompensationBytes:
              0,
          },
        ),
      /project_filesystem_compensation_invalid_max_bytes/,
    );
  },
);
