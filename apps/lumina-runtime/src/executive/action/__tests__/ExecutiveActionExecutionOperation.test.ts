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
  "filesystem replace maps deterministically to filesystem write",
  () => {
    const policy =
      resolveExecutiveActionExecutionOperationPolicy({
        type:
          "filesystem.replace",

        path:
          "README.md",

        content:
          "test",

        expectedSha256:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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

test(
  "filesystem replace requires a valid expected SHA-256",
  () => {
    assert.throws(
      () =>
        validateExecutiveActionExecutionOperation({
          type:
            "filesystem.replace",

          path:
            "docs/architecture.md",

          content:
            "replacement",

          expectedSha256:
            "not-a-sha",
        }),
      /executive_execution_operation_expected_sha256_invalid/,
    );
  },
);

test(
  "filesystem replace accepts exact SHA-256 precondition",
  () => {
    assert.doesNotThrow(
      () =>
        validateExecutiveActionExecutionOperation({
          type:
            "filesystem.replace",

          path:
            "docs/architecture.md",

          content:
            "replacement",

          expectedSha256:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        }),
    );
  },
);

test(
  "filesystem replace remains project scoped and maps to write capability",
  () => {
    const policy =
      resolveExecutiveActionExecutionOperationPolicy({
        type:
          "filesystem.replace",

        path:
          "docs/architecture.md",

        content:
          "replacement",

        expectedSha256:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      });

    assert.deepEqual(
      policy,
      {
        capability:
          "filesystem:write",

        scope:
          "project",
      },
    );
  },
);
