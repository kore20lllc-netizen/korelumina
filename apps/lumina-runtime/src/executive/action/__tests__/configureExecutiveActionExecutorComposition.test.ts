import assert from "node:assert/strict";
import test from "node:test";

import {
  configureExecutiveActionExecutorComposition,
} from "../configureExecutiveActionExecutorComposition.js";

import {
  ExecutiveActionExecutorPolicyRegistry,
} from "../ExecutiveActionExecutorPolicyRegistry.js";

import {
  ExecutiveActionExecutorRegistry,
} from "../ExecutiveActionExecutorRegistry.js";

function createComposition(
  mutationEnabled:
    boolean,
) {
  const policyRegistry =
    new ExecutiveActionExecutorPolicyRegistry();

  const executorRegistry =
    new ExecutiveActionExecutorRegistry();

  configureExecutiveActionExecutorComposition({
    policyRegistry,
    executorRegistry,
    mutationEnabled,
  });

  return {
    policyRegistry,
    executorRegistry,
  };
}

test(
  "default-disabled composition registers read executor only",
  () => {
    const {
      policyRegistry,
      executorRegistry,
    } =
      createComposition(
        false,
      );

    assert.deepEqual(
      executorRegistry.list(),
      [
        {
          operationType:
            "filesystem.read",

          executorName:
            "project-filesystem-read",
        },
      ],
    );

    assert.equal(
      policyRegistry.list()
        .length,
      1,
    );

    assert.equal(
      policyRegistry.get(
        "project-filesystem-replace",
      ),
      undefined,
    );

    assert.throws(
      () =>
        executorRegistry.resolve({
          type:
            "filesystem.replace",

          path:
            "README.md",

          content:
            "replacement",

          expectedSha256:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        }),
      /executive_action_executor_operation_not_registered/,
    );
  },
);

test(
  "enabled composition registers exactly read and guarded replace",
  () => {
    const {
      policyRegistry,
      executorRegistry,
    } =
      createComposition(
        true,
      );

    assert.deepEqual(
      executorRegistry.list(),
      [
        {
          operationType:
            "filesystem.read",

          executorName:
            "project-filesystem-read",
        },

        {
          operationType:
            "filesystem.replace",

          executorName:
            "project-filesystem-replace",
        },
      ],
    );

    assert.equal(
      policyRegistry.list()
        .length,
      2,
    );

    const replacePolicy =
      policyRegistry.get(
        "project-filesystem-replace",
      );

    assert.ok(
      replacePolicy,
    );

    assert.deepEqual(
      replacePolicy.capabilities,
      [
        "filesystem:write",
      ],
    );

    assert.deepEqual(
      replacePolicy.scopes,
      [
        "project",
      ],
    );

    assert.equal(
      replacePolicy.requiresProjectId,
      true,
    );

    assert.equal(
      replacePolicy.metadata
        .activationGate,
      "LUMINA_EXECUTIVE_MUTATION_ENABLED",
    );

    assert.equal(
      replacePolicy.metadata
        .expectedSha256Required,
      true,
    );

    assert.equal(
      replacePolicy.metadata
        .compensationRequired,
      true,
    );
  },
);

test(
  "replace policy permits project-scoped filesystem write only",
  () => {
    const {
      policyRegistry,
    } =
      createComposition(
        true,
      );

    const allowed =
      policyRegistry.evaluate({
        executorName:
          "project-filesystem-replace",

        capability:
          "filesystem:write",

        scope:
          "project",

        projectId:
          "project:test",
      });

    assert.equal(
      allowed.allowed,
      true,
    );

    const processDenied =
      policyRegistry.evaluate({
        executorName:
          "project-filesystem-replace",

        capability:
          "process:spawn",

        scope:
          "project",

        projectId:
          "project:test",
      });

    assert.equal(
      processDenied.allowed,
      false,
    );

    const deleteDenied =
      policyRegistry.evaluate({
        executorName:
          "project-filesystem-replace",

        capability:
          "filesystem:delete",

        scope:
          "project",

        projectId:
          "project:test",
      });

    assert.equal(
      deleteDenied.allowed,
      false,
    );
  },
);

test(
  "replace policy refuses execution without governed project identity",
  () => {
    const {
      policyRegistry,
    } =
      createComposition(
        true,
      );

    const decision =
      policyRegistry.evaluate({
        executorName:
          "project-filesystem-replace",

        capability:
          "filesystem:write",

        scope:
          "project",
      });

    assert.equal(
      decision.allowed,
      false,
    );

    assert.equal(
      decision.reason,
      "executive_executor_project_scope_required",
    );
  },
);
