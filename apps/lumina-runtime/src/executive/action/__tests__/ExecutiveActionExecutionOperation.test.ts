import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveExecutiveActionExecutionOperationPolicy,
  validateExecutiveActionExecutionOperation,
} from "../ExecutiveActionExecutionOperation.js";

test(
  "filesystem read maps deterministically to filesystem read project policy",
  () => {
    const policy =
      resolveExecutiveActionExecutionOperationPolicy({
        type:
          "filesystem.read",

        path:
          "README.md",
      });

    assert.deepEqual(
      policy,
      {
        capability:
          "filesystem:read",

        scope:
          "project",
      },
    );
  },
);

test(
  "filesystem write maps deterministically to filesystem write",
  () => {
    const policy =
      resolveExecutiveActionExecutionOperationPolicy({
        type:
          "filesystem.write",

        path:
          "README.md",

        content:
          "test",
      });

    assert.equal(
      policy.capability,
      "filesystem:write",
    );
  },
);

test(
  "runtime restart cannot masquerade as filesystem read",
  () => {
    const policy =
      resolveExecutiveActionExecutionOperationPolicy({
        type:
          "runtime.restart",
      });

    assert.equal(
      policy.capability,
      "runtime:restart",
    );

    assert.equal(
      policy.scope,
      "project",
    );
  },
);

test(
  "filesystem traversal target is rejected",
  () => {
    assert.throws(
      () =>
        validateExecutiveActionExecutionOperation({
          type:
            "filesystem.read",

          path:
            "../secret",
        }),
      /executive_execution_operation_path_outside_project/,
    );
  },
);

test(
  "absolute filesystem target is rejected",
  () => {
    assert.throws(
      () =>
        validateExecutiveActionExecutionOperation({
          type:
            "filesystem.read",

          path:
            "/etc/passwd",
        }),
      /executive_execution_operation_path_outside_project/,
    );
  },
);

test(
  "network operation requires https",
  () => {
    assert.throws(
      () =>
        validateExecutiveActionExecutionOperation({
          type:
            "network.request",

          url:
            "http://example.com",

          method:
            "GET",
        }),
      /executive_execution_operation_https_required/,
    );
  },
);

test(
  "valid project-relative filesystem operation passes validation",
  () => {
    assert.doesNotThrow(
      () =>
        validateExecutiveActionExecutionOperation({
          type:
            "filesystem.read",

          path:
            "docs/architecture/README.md",
        }),
    );
  },
);
