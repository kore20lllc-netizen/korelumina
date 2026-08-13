import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveAuditService,
} from "../../audit/index.js";

import {
  ExecutiveDelegationService,
} from "../../delegation/index.js";

import type {
  ExecutiveActionExecutor,
} from "../ExecutiveActionExecutor.js";

import {
  ExecutiveActionExecutionAuthorizationService,
} from "../ExecutiveActionExecutionAuthorizationService.js";

import {
  ExecutiveActionExecutionOutcomeService,
} from "../ExecutiveActionExecutionOutcomeService.js";

import {
  ExecutiveActionExecutionStartService,
} from "../ExecutiveActionExecutionStartService.js";

import {
  ExecutiveActionExecutorService,
} from "../ExecutiveActionExecutorService.js";

import {
  createExecutiveActionExecutorPolicy,
} from "../ExecutiveActionExecutorPolicy.js";

import {
  ExecutiveActionExecutorPolicyRegistry,
} from "../ExecutiveActionExecutorPolicyRegistry.js";

import {
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

function createRunningContext(
  executor:
    ExecutiveActionExecutor,

  capabilities:
    readonly (
      | "filesystem:read"
      | "filesystem:write"
    )[] = [
      "filesystem:read",
    ],
) {
  const actionService =
    new ExecutiveActionService();

  const delegationService =
    new ExecutiveDelegationService();

  const authorizationService =
    new ExecutiveActionExecutionAuthorizationService();

  const auditService =
    new ExecutiveAuditService();

  const delegation =
    delegationService.create({
      id:
        "delegation:executor:test",

      sessionId:
        "session:test",

      decisionId:
        "decision:test",

      assignedBy:
        "human:reviewer",

      assignedTo:
        "agent:architecture-engineer",

      title:
        "Executor test",

      description:
        "Governed executor test.",
    });

  const accepted =
    delegationService.updateStatus(
      delegation.id,
      "accepted",
    );

  const action =
    actionService.create({
      id:
        "action:executor:test",

      sessionId:
        "session:test",

      delegationId:
        accepted.id,

      title:
        "Executor test",

      description:
        "Governed executor test.",

      ownerId:
        accepted.assignedTo,

      status:
        "ready",

      metadata: {
        decisionId:
          "decision:test",

        projectId:
          "project:korelumina",

        workspaceId:
          "workspace:default",

        decisionEvidence: [
          "canonical:architecture:test",
        ],
      },
    });

  const authorization =
    authorizationService.authorize({
      action,
      delegation:
        accepted,

      actorId:
        action.ownerId,
    });

  const startService =
    new ExecutiveActionExecutionStartService(
      actionService,
      delegationService,
      authorizationService,
      auditService,
    );

  const started =
    startService.start({
      actionId:
        action.id,

      authorizationId:
        authorization.id,

      actorId:
        action.ownerId,
    });

  const outcomeService =
    new ExecutiveActionExecutionOutcomeService(
      actionService,
      delegationService,
      auditService,
    );

  const policyRegistry =
    new ExecutiveActionExecutorPolicyRegistry();

  policyRegistry.register(
    createExecutiveActionExecutorPolicy({
      executorName:
        executor.name,

      capabilities,

      scopes: [
        "project",
      ],

      requiresProjectId:
        true,
    }),
  );

  const executorService =
    new ExecutiveActionExecutorService(
      actionService,
      delegationService,
      authorizationService,
      auditService,
      outcomeService,
      policyRegistry,
      executor,
    );

  return {
    actionService,
    delegationService,
    authorizationService,
    auditService,
    executorService,
    action:
      started.action,
    delegation:
      started.delegation,
    authorization:
      started.authorization,
    startAudit:
      started.audit,
  };
}

test(
  "successful executor result completes governed action",
  async () => {
    const executor:
      ExecutiveActionExecutor = {
        name:
          "test-success",

        execute: async () => ({
          ok:
            true,

          summary:
            "External operation verified.",

          evidence: [
            "executor:evidence:success",
          ],

          metadata: {},
        }),
      };

    const context =
      createRunningContext(
        executor,
      );

    const result =
      await context.executorService
        .execute({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          authorizationId:
            context.authorization.id,

          startAuditId:
            context.startAudit.id,

            operation: {
              type:
                "filesystem.read",

              path:
                "KORELUMINA_MASTER_ARCHITECTURE.md",
            },
        });

    assert.equal(
      result.action.status,
      "completed",
    );

    assert.equal(
      result.delegation.status,
      "completed",
    );

    assert.ok(
      result.audit.evidence.includes(
        "executor:evidence:success",
      ),
    );
  },
);

test(
  "failed executor result enters governed failed state",
  async () => {
    const executor:
      ExecutiveActionExecutor = {
        name:
          "test-failure",

        execute: async () => ({
          ok:
            false,

          reason:
            "External operation failed.",

          evidence: [
            "executor:evidence:failure",
          ],

          compensationRequired:
            true,

          compensationPlan:
            "Restore prior state.",

          metadata: {},
        }),
      };

    const context =
      createRunningContext(
        executor,
      );

    const result =
      await context.executorService
        .execute({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          authorizationId:
            context.authorization.id,

          startAuditId:
            context.startAudit.id,

            operation: {
              type:
                "filesystem.read",

              path:
                "KORELUMINA_MASTER_ARCHITECTURE.md",
            },
        });

    assert.equal(
      result.action.status,
      "failed",
    );

    assert.equal(
      result.delegation.status,
      "failed",
    );

    assert.equal(
      result.audit.metadata
        .compensationStatus,
      "required",
    );
  },
);

test(
  "executor exception is converted to governed failure",
  async () => {
    const executor:
      ExecutiveActionExecutor = {
        name:
          "test-throw",

        execute: async () => {
          throw new Error(
            "executor exploded",
          );
        },
      };

    const context =
      createRunningContext(
        executor,
      );

    const result =
      await context.executorService
        .execute({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          authorizationId:
            context.authorization.id,

          startAuditId:
            context.startAudit.id,

            operation: {
              type:
                "filesystem.read",

              path:
                "KORELUMINA_MASTER_ARCHITECTURE.md",
            },
        });

    assert.equal(
      result.action.status,
      "failed",
    );

    assert.equal(
      result.audit.metadata
        .failureReason,
      "executor exploded",
    );
  },
);

test(
  "executor cannot run before authorization is consumed",
  async () => {
    const executor:
      ExecutiveActionExecutor = {
        name:
          "should-not-run",

        execute: async () => {
          throw new Error(
            "must not execute",
          );
        },
      };

    const context =
      createRunningContext(
        executor,
      );

    const unconsumed =
      Object.freeze({
        ...context.authorization,

        consumedAt:
          undefined,
      });

    const authorizationStore =
      context.authorizationService as unknown as {
        authorizations:
          Map<string, unknown>;
      };

    authorizationStore.authorizations.set(
      unconsumed.id,
      unconsumed,
    );

    await assert.rejects(
      () =>
        context.executorService
          .execute({
            actionId:
              context.action.id,

            actorId:
              context.action.ownerId,

            authorizationId:
              unconsumed.id,

            startAuditId:
              context.startAudit.id,

              operation: {
                type:
                  "filesystem.read",

                path:
                  "KORELUMINA_MASTER_ARCHITECTURE.md",
              },
          }),
      /executive_executor_authorization_not_consumed/,
    );

    assert.equal(
      context.actionService
        .get(
          context.action.id,
        )
        ?.status,
      "running",
    );
  },
);

test(
  "wrong actor cannot invoke executor",
  async () => {
    let invoked =
      false;

    const executor:
      ExecutiveActionExecutor = {
        name:
          "should-not-run",

        execute: async () => {
          invoked =
            true;

          return {
            ok:
              true,

            summary:
              "Invalid.",

            evidence:
              [],

            metadata: {},
          };
        },
      };

    const context =
      createRunningContext(
        executor,
      );

    await assert.rejects(
      () =>
        context.executorService
          .execute({
            actionId:
              context.action.id,

            actorId:
              "agent:other",

            authorizationId:
              context.authorization.id,

            startAuditId:
              context.startAudit.id,

              operation: {
                type:
                  "filesystem.read",

                path:
                  "KORELUMINA_MASTER_ARCHITECTURE.md",
              },
          }),
      /executive_executor_actor_not_authorized/,
    );

    assert.equal(
      invoked,
      false,
    );
  },
);

test(
  "executor adapter cannot directly own executive state transitions",
  async () => {
    let observedStatus =
      "";

    const executor:
      ExecutiveActionExecutor = {
        name:
          "observe-only",

        execute: async (
          context,
        ) => {
          observedStatus =
            context.action.status;

          return {
            ok:
              true,

            summary:
              "Adapter returned result only.",

            evidence:
              [],

            metadata: {},
          };
        },
      };

    const context =
      createRunningContext(
        executor,
      );

    const result =
      await context.executorService
        .execute({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          authorizationId:
            context.authorization.id,

          startAuditId:
            context.startAudit.id,

            operation: {
              type:
                "filesystem.read",

              path:
                "KORELUMINA_MASTER_ARCHITECTURE.md",
            },
        });

    assert.equal(
      observedStatus,
      "running",
    );

    assert.equal(
      result.action.status,
      "completed",
    );
  },
);

test(
  "operation determines capability instead of caller-supplied claim",
  async () => {
    let invoked =
      false;

    const executor:
      ExecutiveActionExecutor = {
        name:
          "operation-capability-test",

        execute: async () => {
          invoked =
            true;

          return {
            ok:
              true,

            summary:
              "Must not execute.",

            evidence:
              [],

            metadata: {},
          };
        },
      };

    const context =
      createRunningContext(
        executor,
      );

    await assert.rejects(
      () =>
        context.executorService
          .execute({
            actionId:
              context.action.id,

            actorId:
              context.action.ownerId,

            authorizationId:
              context.authorization.id,

            startAuditId:
              context.startAudit.id,

            operation: {
              type:
                "filesystem.replace",

              path:
                "docs/governed.md",

              content:
                "mutation",

              expectedSha256:
                  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            },
          }),
      /executive_executor_capability_not_declared/,
    );

    assert.equal(
      invoked,
      false,
    );
  },
);

test(
  "executor receives the exact typed operation after policy approval",
  async () => {
    let receivedType =
      "";

    let receivedPath =
      "";

    const executor:
      ExecutiveActionExecutor = {
        name:
          "operation-forwarding-test",

        execute: async (
          context,
        ) => {
          receivedType =
            context.operation.type;

          if (
            context.operation.type ===
            "filesystem.read"
          ) {
            receivedPath =
              context.operation.path;
          }

          return {
            ok:
              true,

            summary:
              "Typed operation observed.",

            evidence:
              [],

            metadata: {},
          };
        },
      };

    const context =
      createRunningContext(
        executor,
      );

    const result =
      await context.executorService
        .execute({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          authorizationId:
            context.authorization.id,

          startAuditId:
            context.startAudit.id,

          operation: {
            type:
              "filesystem.read",

            path:
              "KORELUMINA_MASTER_ARCHITECTURE.md",
          },
        });

    assert.equal(
      receivedType,
      "filesystem.read",
    );

    assert.equal(
      receivedPath,
      "KORELUMINA_MASTER_ARCHITECTURE.md",
    );

    assert.equal(
      result.action.status,
      "completed",
    );
  },
);

test(
  "project filesystem operation rejects traversal target before adapter invocation",
  async () => {
    let invoked =
      false;

    const executor:
      ExecutiveActionExecutor = {
        name:
          "path-boundary-test",

        execute: async () => {
          invoked =
            true;

          return {
            ok:
              true,

            summary:
              "Must not execute.",

            evidence:
              [],

            metadata: {},
          };
        },
      };

    const context =
      createRunningContext(
        executor,
      );

    await assert.rejects(
      () =>
        context.executorService
          .execute({
            actionId:
              context.action.id,

            actorId:
              context.action.ownerId,

            authorizationId:
              context.authorization.id,

            startAuditId:
              context.startAudit.id,

            operation: {
              type:
                "filesystem.read",

              path:
                "../outside.txt",
            },
          }),
      /executive_execution_operation_path_outside_project/,
    );

    assert.equal(
      invoked,
      false,
    );
  },
);

test(
  "filesystem replacement cannot complete without compensation evidence",
  async () => {
    const executor:
      ExecutiveActionExecutor = {
        name:
          "invalid-mutation-result",

        execute: async () => ({
          ok:
            true,

          summary:
            "Mutation claimed success.",

          evidence: [
            "mutation:test",
          ],

          metadata: {
            afterSha256:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
        }),
      };

    const context =
      createRunningContext(
        executor,
        [
          "filesystem:write",
        ],
      );

    const result =
      await context.executorService
        .execute({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          authorizationId:
            context.authorization.id,

          startAuditId:
            context.startAudit.id,

          operation: {
            type:
              "filesystem.replace",

            path:
              "docs/governed.md",

            content:
              "replacement",

            expectedSha256:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
        });

    assert.equal(
      result.action.status,
      "failed",
    );

    assert.equal(
      result.delegation.status,
      "failed",
    );

    assert.equal(
      result.executionResult.ok,
      false,
    );

    if (
      result.executionResult.ok
    ) {
      return;
    }

    assert.equal(
      result.executionResult
        .compensationRequired,
      true,
    );

    assert.equal(
      result.audit.metadata
        .compensationStatus,
      "required",
    );

    assert.equal(
      result.audit.status,
      "open",
    );
  },
);

test(
  "compensation-bearing replacement failure becomes governed failed outcome",
  async () => {
    const snapshot = {
      encoding:
        "base64",

      content:
        "YmVmb3Jl",

      sha256:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

      bytes:
        6,
    };

    const executor:
      ExecutiveActionExecutor = {
        name:
          "post-mutation-failure",

        execute: async () => ({
          ok:
            false,

          reason:
            "project_filesystem_replace_postcondition_failed",

          evidence: [
            "mutation:committed",
          ],

          compensationRequired:
            true,

          compensationPlan:
            "Restore exact prior bytes.",

          metadata: {
            mutationCommitted:
              true,

            compensationRequired:
              true,

            compensationSnapshot:
              snapshot,

            afterSha256:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
        }),
      };

    const context =
      createRunningContext(
        executor,
        [
          "filesystem:write",
        ],
      );

    const result =
      await context.executorService
        .execute({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          authorizationId:
            context.authorization.id,

          startAuditId:
            context.startAudit.id,

          operation: {
            type:
              "filesystem.replace",

            path:
              "docs/governed.md",

            content:
              "replacement",

            expectedSha256:
              "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        });

    assert.equal(
      result.action.status,
      "failed",
    );

    assert.equal(
      result.audit.status,
      "open",
    );

    assert.equal(
      result.audit.metadata
        .compensationRequired,
      true,
    );

    assert.deepEqual(
      result.executionResult
        .metadata
        .compensationSnapshot,
      snapshot,
    );
  },
);
