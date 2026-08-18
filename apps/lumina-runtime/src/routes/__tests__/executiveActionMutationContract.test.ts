import assert from "node:assert/strict";
import test from "node:test";

import {
  mapExecutiveActionMutationError,
  parseExecutiveActionReplacementRequest,
} from "../executiveActionMutationContract.js";

const SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

test(
  "valid replacement request requires execution authorization and compensation contract",
  () => {
    const request =
      parseExecutiveActionReplacementRequest({
        actorId:
          "agent:architecture-engineer",

        authorizationId:
          "execution-authorization:action:test",

        startAuditId:
          "audit:execution-start:action:test",

        operation: {
          type:
            "filesystem.replace",

          path:
            "docs/architecture.md",

          content:
            "replacement",

          expectedSha256:
            SHA,
        },

        compensation: {
          required:
            true,

          plan:
            "Restore exact pre-replacement bytes from governed snapshot.",
        },
      });

    assert.equal(
      request.operation.type,
      "filesystem.replace",
    );

    assert.equal(
      request.operation.expectedSha256,
      SHA,
    );

    assert.equal(
      request.compensation.required,
      true,
    );
  },
);

test(
  "replacement request cannot omit execution authorization",
  () => {
    assert.throws(
      () =>
        parseExecutiveActionReplacementRequest({
          actorId:
            "agent:test",

          startAuditId:
            "audit:start",

          operation: {
            type:
              "filesystem.replace",

            path:
              "README.md",

            content:
              "replacement",

            expectedSha256:
              SHA,
          },

          compensation: {
            required:
              true,

            plan:
              "Restore prior bytes.",
          },
        }),
      /executive_execution_authorization_id_required/,
    );
  },
);

test(
  "replacement request requires exact expected SHA",
  () => {
    assert.throws(
      () =>
        parseExecutiveActionReplacementRequest({
          actorId:
            "agent:test",

          authorizationId:
            "authorization:test",

          startAuditId:
            "audit:start",

          operation: {
            type:
              "filesystem.replace",

            path:
              "README.md",

            content:
              "replacement",

            expectedSha256:
              "stale",
          },

          compensation: {
            required:
              true,

            plan:
              "Restore prior bytes.",
          },
        }),
      /executive_execution_operation_expected_sha256_invalid/,
    );
  },
);

test(
  "replacement request cannot waive compensation requirement",
  () => {
    assert.throws(
      () =>
        parseExecutiveActionReplacementRequest({
          actorId:
            "agent:test",

          authorizationId:
            "authorization:test",

          startAuditId:
            "audit:start",

          operation: {
            type:
              "filesystem.replace",

            path:
              "README.md",

            content:
              "replacement",

            expectedSha256:
              SHA,
          },

          compensation: {
            required:
              false,

            plan:
              "none",
          },
        }),
      /executive_mutation_compensation_must_be_required/,
    );
  },
);

test(
  "replacement request requires compensation plan",
  () => {
    assert.throws(
      () =>
        parseExecutiveActionReplacementRequest({
          actorId:
            "agent:test",

          authorizationId:
            "authorization:test",

          startAuditId:
            "audit:start",

          operation: {
            type:
              "filesystem.replace",

            path:
              "README.md",

            content:
              "replacement",

            expectedSha256:
              SHA,
          },

          compensation: {
            required:
              true,

            plan:
              "",
          },
        }),
      /executive_mutation_compensation_plan_required/,
    );
  },
);

test(
  "mutation contract rejects every operation except filesystem.replace",
  () => {
    assert.throws(
      () =>
        parseExecutiveActionReplacementRequest({
          actorId:
            "agent:test",

          authorizationId:
            "authorization:test",

          startAuditId:
            "audit:start",

          operation: {
            type:
              "filesystem.delete",

            path:
              "README.md",
          },

          compensation: {
            required:
              true,

            plan:
              "Restore.",
          },
        }),
      /executive_mutation_operation_not_supported/,
    );
  },
);

test(
  "stale replacement hash maps to conflict",
  () => {
    const mapped =
      mapExecutiveActionMutationError(
        new Error(
          "project_filesystem_replace_precondition_failed",
        ),
      );

    assert.deepEqual(
      mapped,
      {
        status:
          409,

        error:
          "project_filesystem_replace_precondition_failed",
      },
    );
  },
);

test(
  "missing replacement target maps to not found",
  () => {
    const mapped =
      mapExecutiveActionMutationError(
        new Error(
          "project_filesystem_replace_target_not_found",
        ),
      );

    assert.equal(
      mapped.status,
      404,
    );
  },
);

test(
  "unauthorized mutation actor maps to forbidden",
  () => {
    const mapped =
      mapExecutiveActionMutationError(
        new Error(
          "executive_executor_actor_not_authorized",
        ),
      );

    assert.equal(
      mapped.status,
      403,
    );
  },
);

test(
  "unknown mutation failures are concealed as generic server error",
  () => {
    const mapped =
      mapExecutiveActionMutationError(
        new Error(
          "internal-sensitive-error",
        ),
      );

    assert.deepEqual(
      mapped,
      {
        status:
          500,

        error:
          "executive_action_mutation_failed",
      },
    );
  },
);
