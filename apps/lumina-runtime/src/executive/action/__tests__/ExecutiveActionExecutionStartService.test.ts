import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveAuditService,
} from "../../audit/index.js";

import {
  ExecutiveDelegationService,
} from "../../delegation/index.js";

import {
  ExecutiveActionExecutionAuthorizationService,
} from "../ExecutiveActionExecutionAuthorizationService.js";

import {
  ExecutiveActionExecutionStartService,
} from "../ExecutiveActionExecutionStartService.js";

import {
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

function createContext() {
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
        "delegation:decision:test",

      sessionId:
        "session:test",

      decisionId:
        "decision:test",

      assignedBy:
        "human:reviewer",

      assignedTo:
        "agent:architecture-engineer",

      title:
        "Governed execution",

      description:
        "Accepted delegated action.",
    });

  const accepted =
    delegationService.updateStatus(
      delegation.id,
      "accepted",
    );

  const action =
    actionService.create({
      id:
        "action:decision:test",

      sessionId:
        "session:test",

      delegationId:
        accepted.id,

      title:
        "Governed execution",

      description:
        "Ready executive action.",

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

  return {
    actionService,
    delegationService,
    authorizationService,
    auditService,
    startService,
    action,
    delegation:
      accepted,
    authorization,
  };
}

test(
  "starts exact authorized ready action and consumes authorization",
  () => {
    const context =
      createContext();

    const result =
      context.startService.start({
        actionId:
          context.action.id,

        authorizationId:
          context.authorization.id,

        actorId:
          context.action.ownerId,
      });

    assert.equal(
      result.action.status,
      "running",
    );

    assert.equal(
      typeof result.action.startedAt,
      "number",
    );

    assert.equal(
      result.delegation.status,
      "in-progress",
    );

    assert.equal(
      typeof result.authorization.consumedAt,
      "number",
    );

    assert.equal(
      result.audit.source,
      "executive-action-execution-start",
    );

    assert.equal(
      result.audit.metadata.actionId,
      context.action.id,
    );
  },
);

test(
  "pre-start audit is created with governed evidence",
  () => {
    const context =
      createContext();

    const result =
      context.startService.start({
        actionId:
          context.action.id,

        authorizationId:
          context.authorization.id,

        actorId:
          context.action.ownerId,
      });

    assert.ok(
      result.audit.evidence.includes(
        "canonical:architecture:test",
      ),
    );

    assert.ok(
      result.audit.evidence.includes(
        context.authorization.id,
      ),
    );

    assert.equal(
      context.auditService.list().length,
      1,
    );
  },
);

test(
  "authorization cannot be consumed twice",
  () => {
    const context =
      createContext();

    context.startService.start({
      actionId:
        context.action.id,

      authorizationId:
        context.authorization.id,

      actorId:
        context.action.ownerId,
    });

    assert.throws(
      () =>
        context.startService.start({
          actionId:
            context.action.id,

          authorizationId:
            context.authorization.id,

          actorId:
            context.action.ownerId,
        }),
      /executive_action_not_ready_for_execution_start/,
    );

    assert.equal(
      context.auditService.list().length,
      1,
    );
  },
);

test(
  "wrong actor cannot start execution or consume authorization",
  () => {
    const context =
      createContext();

    assert.throws(
      () =>
        context.startService.start({
          actionId:
            context.action.id,

          authorizationId:
            context.authorization.id,

          actorId:
            "agent:other",
        }),
      /executive_execution_starter_not_authorized/,
    );

    assert.equal(
      context.actionService
        .get(
          context.action.id,
        )
        ?.status,
      "ready",
    );

    assert.equal(
      context.authorizationService
        .get(
          context.authorization.id,
        )
        ?.consumedAt,
      undefined,
    );

    assert.deepEqual(
      context.auditService.list(),
      [],
    );
  },
);

test(
  "authorization for another action cannot start this action",
  () => {
    const context =
      createContext();

    const secondAction =
      context.actionService.create({
        id:
          "action:second",

        sessionId:
          "session:test",

        delegationId:
          context.delegation.id,

        title:
          "Second",

        description:
          "Second action.",

        ownerId:
          context.action.ownerId,

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

    const secondAuthorization =
      new ExecutiveActionExecutionAuthorizationService()
        .authorize({
          action:
            secondAction,

          delegation:
            context.delegation,

          actorId:
            secondAction.ownerId,
        });

    assert.throws(
      () =>
        context.startService.start({
          actionId:
            context.action.id,

          authorizationId:
            secondAuthorization.id,

          actorId:
            context.action.ownerId,
        }),
      /executive_execution_authorization_not_found/,
    );

    assert.equal(
      context.actionService
        .get(
          context.action.id,
        )
        ?.status,
      "ready",
    );
  },
);

test(
  "start service invokes no external executor",
  () => {
    const context =
      createContext();

    const result =
      context.startService.start({
        actionId:
          context.action.id,

        authorizationId:
          context.authorization.id,

        actorId:
          context.action.ownerId,
      });

    assert.equal(
      result.action.status,
      "running",
    );

    assert.equal(
      result.action.completedAt,
      undefined,
    );
  },
);
