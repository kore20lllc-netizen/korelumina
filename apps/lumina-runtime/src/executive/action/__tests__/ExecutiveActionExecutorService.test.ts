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
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

function createRunningContext(
  executor:
    ExecutiveActionExecutor,
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

  const executorService =
    new ExecutiveActionExecutorService(
      actionService,
      delegationService,
      authorizationService,
      auditService,
      outcomeService,
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
