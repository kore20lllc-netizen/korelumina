import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type {
  ExecutiveAction,
} from "../ExecutiveAction.js";

import {
  ProjectFilesystemReadExecutor,
} from "../ProjectFilesystemReadExecutor.js";

function createTempProject() {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "korelumina-executor-",
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
  projectId:
    string | undefined =
      "project:test",
): ExecutiveAction {
  const now =
    Date.now();

  return Object.freeze({
    id:
      "action:filesystem-read:test",

    sessionId:
      "session:test",

    delegationId:
      "delegation:test",

    title:
      "Read governed project file",

    description:
      "Read-only executor test.",

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

        ...(projectId
          ? {
              projectId,
            }
          : {}),

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

  operation:
    {
      readonly type:
        "filesystem.read";

      readonly path:
        string;
    },
) {
  return {
    action,

    actorId:
      action.ownerId,

    authorizationId:
      "execution-authorization:test",

    startAuditId:
      "audit:execution-start:test",

    operation,
  } as const;
}

test(
  "reads a bounded UTF-8 file inside governed project root",
  () => {
    const project =
      createTempProject();

    try {
      fs.mkdirSync(
        path.join(
          project.root,
          "docs",
        ),
        {
          recursive:
            true,
        },
      );

      fs.writeFileSync(
        path.join(
          project.root,
          "docs",
          "architecture.md",
        ),
        "governed architecture",
        "utf8",
      );

      const executor =
        new ProjectFilesystemReadExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      const result =
        executor.execute(
          createContext(
            createAction(),
            {
              type:
                "filesystem.read",

              path:
                "docs/architecture.md",
            },
          ),
        );

      assert.equal(
        result.ok,
        true,
      );

      if (!result.ok) {
        return;
      }

      assert.equal(
        result.metadata
          .content,
        "governed architecture",
      );

      assert.equal(
        result.metadata
          .path,
        "docs/architecture.md",
      );

      assert.equal(
        result.metadata
          .encoding,
        "utf8",
      );

      assert.ok(
        result.evidence.includes(
          "project:project:test",
        ),
      );

      assert.ok(
        result.evidence.includes(
          "file:docs/architecture.md",
        ),
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "project identity is required from governed action metadata",
  () => {
    const project =
      createTempProject();

    try {
      const executor =
        new ProjectFilesystemReadExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(
                "",
              ),
              {
                type:
                  "filesystem.read",

                path:
                  "README.md",
              },
            ),
          ),
        /project_filesystem_read_executor_project_id_required/,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "missing file is rejected",
  () => {
    const project =
      createTempProject();

    try {
      const executor =
        new ProjectFilesystemReadExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              {
                type:
                  "filesystem.read",

                path:
                  "missing.txt",
              },
            ),
          ),
        /project_filesystem_read_file_not_found/,
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
        new ProjectFilesystemReadExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              {
                type:
                  "filesystem.read",

                path:
                  "docs",
              },
            ),
          ),
        /project_filesystem_read_target_not_file/,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "oversized file is rejected before read",
  () => {
    const project =
      createTempProject();

    try {
      fs.writeFileSync(
        path.join(
          project.root,
          "large.txt",
        ),
        "123456789",
        "utf8",
      );

      const executor =
        new ProjectFilesystemReadExecutor({
          maxReadBytes:
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
              {
                type:
                  "filesystem.read",

                path:
                  "large.txt",
              },
            ),
          ),
        /project_filesystem_read_size_limit_exceeded/,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "symlink escaping project root is rejected",
  () => {
    const project =
      createTempProject();

    const outside =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-executor-outside-",
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
        new ProjectFilesystemReadExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      assert.throws(
        () =>
          executor.execute(
            createContext(
              createAction(),
              {
                type:
                  "filesystem.read",

                path:
                  "escape.txt",
              },
            ),
          ),
        /project_filesystem_read_symlink_escape_detected/,
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
  "symlink remaining inside project root is allowed",
  () => {
    const project =
      createTempProject();

    try {
      fs.writeFileSync(
        path.join(
          project.root,
          "target.txt",
        ),
        "inside",
        "utf8",
      );

      fs.symlinkSync(
        path.join(
          project.root,
          "target.txt",
        ),
        path.join(
          project.root,
          "link.txt",
        ),
      );

      const executor =
        new ProjectFilesystemReadExecutor({
          resolveProjectPath:
            () =>
              project.root,
        });

      const result =
        executor.execute(
          createContext(
            createAction(),
            {
              type:
                "filesystem.read",

              path:
                "link.txt",
            },
          ),
        );

      assert.equal(
        result.ok,
        true,
      );

      if (result.ok) {
        assert.equal(
          result.metadata
            .content,
          "inside",
        );
      }
    } finally {
      project.cleanup();
    }
  },
);

test(
  "non-read operation is rejected by concrete adapter",
  () => {
    const project =
      createTempProject();

    try {
      const executor =
        new ProjectFilesystemReadExecutor({
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
                "runtime.start",
            },
          }),
        /project_filesystem_read_executor_operation_not_supported/,
      );
    } finally {
      project.cleanup();
    }
  },
);

test(
  "invalid read-size configuration is rejected",
  () => {
    assert.throws(
      () =>
        new ProjectFilesystemReadExecutor({
          maxReadBytes:
            0,
        }),
      /project_filesystem_read_executor_invalid_max_read_bytes/,
    );
  },
);
