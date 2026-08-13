import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type {
  ExecutiveAction,
} from "../ExecutiveAction.js";

import {
  ProjectFilesystemReplaceExecutor,
} from "../ProjectFilesystemReplaceExecutor.js";

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
        "korelumina-replace-",
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

function createAction(
  projectId =
    "project:test",
): ExecutiveAction {
  const now =
    Date.now();

  return Object.freeze({
    id:
      "action:filesystem-replace:test",

    sessionId:
      "session:test",

    delegationId:
      "delegation:test",

    title:
      "Replace governed project file",

    description:
      "Replacement executor test.",

    ownerId:
      "agent:architecture-engineer",

    status:
      "running",

    createdAt:
      now,

    updatedAt:
      now,

    startedAt:
      now,

    metadata:
      Object.freeze({
        decisionId:
          "decision:test",

        projectId,

        decisionEvidence:
          Object.freeze([
            "canonical:architecture:test",
          ]),
      }),
  });
}

function createContext(
  action:
    ExecutiveAction,

  path:
    string,

  content:
    string,

  expectedSha256:
    string,
) {
  return {
    action,

    actorId:
      action.ownerId,

    authorizationId:
      "authorization:test",

    startAuditId:
      "audit:start:test",

    operation: {
      type:
        "filesystem.replace",

      path,

      content,

      expectedSha256,
    },
  } as const;
}

test(
  "replaces existing file only when expected SHA matches",
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
        "before architecture";

      const after =
        "after architecture";

      fs.writeFileSync(
        target,
        before,
        "utf8",
      );

      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      const result =
        executor.execute(
          createContext(
            createAction(),
            "architecture.md",
            after,
            sha256(
              before,
            ),
          ),
        );

      assert.equal(
        result.ok,
        true,
      );

      assert.equal(
        fs.readFileSync(
          target,
          "utf8",
        ),
        after,
      );

      if (!result.ok) {
        return;
      }

      assert.equal(
        result.metadata
          .beforeSha256,
        sha256(
          before,
        ),
      );

      assert.equal(
        result.metadata
          .afterSha256,
        sha256(
          after,
        ),
      );

      assert.equal(
        result.metadata
          .atomic,
        true,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "stale expected SHA rejects mutation and preserves exact bytes",
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
        Buffer.from(
          "current bytes",
          "utf8",
        );

      fs.writeFileSync(
        target,
        before,
      );

      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              "architecture.md",
              "replacement",
              "a".repeat(
                64,
              ),
            ),
          ),
        /project_filesystem_replace_precondition_failed/,
      );

      assert.deepEqual(
        fs.readFileSync(
          target,
        ),
        before,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "missing target cannot be created by replacement executor",
  () => {
    const project =
      createTempProject();

    try {
      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              "new-file.txt",
              "new",
              sha256(
                "",
              ),
            ),
          ),
        /project_filesystem_replace_target_not_found/,
      );

      assert.equal(
        fs.existsSync(
          path.join(
            project.root,
            "new-file.txt",
          ),
        ),
        false,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "directory target is rejected",
  () => {
    const project =
      createTempProject();

    try {
      fs.mkdirSync(
        path.join(
          project.root,
          "docs",
        ),
      );

      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              "docs",
              "replacement",
              sha256(
                "",
              ),
            ),
          ),
        /project_filesystem_replace_target_not_file/,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "replacement larger than configured bound is rejected before mutation",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "small.txt",
        );

      fs.writeFileSync(
        target,
        "before",
        "utf8",
      );

      const executor =
        new ProjectFilesystemReplaceExecutor({
          maxReplacementBytes:
            8,

          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              "small.txt",
              "123456789",
              sha256(
                "before",
              ),
            ),
          ),
        /project_filesystem_replace_size_limit_exceeded/,
      );

      assert.equal(
        fs.readFileSync(
          target,
          "utf8",
        ),
        "before",
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "existing file larger than snapshot bound is rejected before mutation",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "large.txt",
        );

      fs.writeFileSync(
        target,
        "123456789",
        "utf8",
      );

      const executor =
        new ProjectFilesystemReplaceExecutor({
          maxReplacementBytes:
            8,

          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              "large.txt",
              "after",
              sha256(
                "123456789",
              ),
            ),
          ),
        /project_filesystem_replace_snapshot_size_limit_exceeded/,
      );

      assert.equal(
        fs.readFileSync(
          target,
          "utf8",
        ),
        "123456789",
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "symlink escaping project root is rejected before mutation",
  () => {
    const project =
      createTempProject();

    const outside =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-replace-outside-",
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
        "outside",
        "utf8",
      );

      fs.symlinkSync(
        outsideFile,
        path.join(
          project.root,
          "escape.txt",
        ),
      );

      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              "escape.txt",
              "mutation",
              sha256(
                "outside",
              ),
            ),
          ),
        /project_filesystem_replace_symlink_escape_detected/,
      );

      assert.equal(
        fs.readFileSync(
          outsideFile,
          "utf8",
        ),
        "outside",
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
  "compensation snapshot restores exact prior bytes",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "binary-safe.txt",
        );

      const before =
        Buffer.from([
          0x00,
          0x01,
          0x02,
          0x0a,
          0xff,
        ]);

      fs.writeFileSync(
        target,
        before,
      );

      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      const result =
        executor.execute(
          createContext(
            createAction(),
            "binary-safe.txt",
            "replacement",
            sha256(
              before,
            ),
          ),
        );

      assert.equal(
        result.ok,
        true,
      );

      if (!result.ok) {
        return;
      }

      const snapshot =
        result.metadata
          .compensationSnapshot as {
            encoding:
              string;

            content:
              string;

            sha256:
              string;

            bytes:
              number;
          };

      const restored =
        Buffer.from(
          snapshot.content,
          "base64",
        );

      assert.deepEqual(
        restored,
        before,
      );

      assert.equal(
        sha256(
          restored,
        ),
        snapshot.sha256,
      );

      assert.equal(
        snapshot.bytes,
        before.length,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "existing permission bits survive atomic replacement",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project.root,
          "script.sh",
        );

      fs.writeFileSync(
        target,
        "before",
        "utf8",
      );

      fs.chmodSync(
        target,
        0o744,
      );

      const beforeMode =
        fs.statSync(
          target,
        ).mode &
        0o777;

      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      executor.execute(
        createContext(
          createAction(),
          "script.sh",
          "after",
          sha256(
            "before",
          ),
        ),
      );

      const afterMode =
        fs.statSync(
          target,
        ).mode &
        0o777;

      assert.equal(
        afterMode,
        beforeMode,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "non-replace operation is rejected",
  () => {
    const project =
      createTempProject();

    try {
      const executor =
        new ProjectFilesystemReplaceExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute({
            action:
              createAction(),

            actorId:
              "agent:architecture-engineer",

            authorizationId:
              "authorization:test",

            startAuditId:
              "audit:test",

            operation: {
              type:
                "filesystem.read",

              path:
                "README.md",
            },
          }),
        /project_filesystem_replace_operation_not_supported/,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "invalid replacement size configuration is rejected",
  () => {
    assert.throws(
      () =>
        new ProjectFilesystemReplaceExecutor({
          maxReplacementBytes:
            0,
        }),
      /project_filesystem_replace_invalid_max_replacement_bytes/,
    );
  },
);
