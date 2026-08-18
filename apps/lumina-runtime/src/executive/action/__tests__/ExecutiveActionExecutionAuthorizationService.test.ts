import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveDelegationService,
} from "../../delegation/index.js";

import {
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

import {
  ExecutiveActionExecutionAuthorizationService,
} from "../ExecutiveActionExecutionAuthorizationService.js";

function createReadyPair() {
  const delegationService =
    new ExecutiveDelegationService();

  const actionService =
    new ExecutiveActionService();

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
        "Governed work",

      description:
        "Approved delegated work.",
    });

  const acceptedDelegation =
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
        acceptedDelegation.id,

      title:
        "Governed work",

      description:
        "Approved delegated work.",

      ownerId:
        acceptedDelegation.assignedTo,

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

  return {
    delegationService,
    actionService,
    delegation:
      acceptedDelegation,
    action,
  };
}

test(
  "assigned owner can explicitly authorize exact ready action for execution without starting it",
  () => {
    const context =
      createReadyPair();

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    const authorization =
      service.authorize({
        action:
          context.action,

        delegation:
          context.delegation,

        actorId:
          context.action.ownerId,
      });

    assert.equal(
      authorization.actionId,
      context.action.id,
    );

    assert.equal(
      authorization.delegationId,
      context.delegation.id,
    );

    assert.equal(
      authorization.actorId,
      context.action.ownerId,
    );

    assert.equal(
      authorization.consumedAt,
      undefined,
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
      context.actionService
        .get(
          context.action.id,
        )
        ?.startedAt,
      undefined,
    );

    assert.equal(
      context.delegationService
        .get(
          context.delegation.id,
        )
        ?.status,
      "accepted",
    );
  },
);

test(
  "non-owner cannot authorize execution",
  () => {
    const context =
      createReadyPair();

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    assert.throws(
      () =>
        service.authorize({
          action:
            context.action,

          delegation:
            context.delegation,

          actorId:
            "agent:other",
        }),
      /executive_execution_authorizer_not_authorized/,
    );

    assert.deepEqual(
      service.list(),
      [],
    );
  },
);

test(
  "action must be ready",
  () => {
    const context =
      createReadyPair();

    const planned =
      context.actionService
        .updateStatus(
          context.action.id,
          "planned",
        );

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    assert.throws(
      () =>
        service.authorize({
          action:
            planned,

          delegation:
            context.delegation,

          actorId:
            planned.ownerId,
        }),
      /executive_action_not_ready_for_execution_authorization/,
    );
  },
);

test(
  "delegation must be accepted",
  () => {
    const context =
      createReadyPair();

    const assigned =
      context.delegationService
        .updateStatus(
          context.delegation.id,
          "assigned",
        );

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    assert.throws(
      () =>
        service.authorize({
          action:
            context.action,

          delegation:
            assigned,

          actorId:
            context.action.ownerId,
        }),
      /executive_delegation_not_accepted_for_execution_authorization/,
    );
  },
);

test(
  "action must belong to the exact delegation",
  () => {
    const context =
      createReadyPair();

    const otherDelegation =
      context.delegationService
        .create({
          id:
            "delegation:other",

          sessionId:
            "session:test",

          decisionId:
            "decision:test",

          assignedBy:
            "human:reviewer",

          assignedTo:
            context.action.ownerId,

          title:
            "Other",

          description:
            "Other delegation.",
        });

    const acceptedOther =
      context.delegationService
        .updateStatus(
          otherDelegation.id,
          "accepted",
        );

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    assert.throws(
      () =>
        service.authorize({
          action:
            context.action,

          delegation:
            acceptedOther,

          actorId:
            context.action.ownerId,
        }),
      /executive_execution_authorization_delegation_mismatch/,
    );
  },
);

test(
  "action owner must match delegation assignee",
  () => {
    const context =
      createReadyPair();

    const mismatchedAction =
      context.actionService
        .create({
          id:
            "action:mismatched-owner",

          sessionId:
            "session:test",

          delegationId:
            context.delegation.id,

          title:
            "Mismatch",

          description:
            "Wrong owner.",

          ownerId:
            "agent:other",

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

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    assert.throws(
      () =>
        service.authorize({
          action:
            mismatchedAction,

          delegation:
            context.delegation,

          actorId:
            mismatchedAction.ownerId,
        }),
      /executive_execution_authorization_owner_mismatch/,
    );
  },
);

test(
  "execution authorization requires governed decision evidence",
  () => {
    const context =
      createReadyPair();

    const withoutEvidence =
      context.actionService
        .create({
          id:
            "action:no-evidence",

          sessionId:
            "session:test",

          delegationId:
            context.delegation.id,

          title:
            "No evidence",

          description:
            "Evidence missing.",

          ownerId:
            context.delegation.assignedTo,

          status:
            "ready",

          metadata: {
            decisionId:
              "decision:test",
          },
        });

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    assert.throws(
      () =>
        service.authorize({
          action:
            withoutEvidence,

          delegation:
            context.delegation,

          actorId:
            withoutEvidence.ownerId,
        }),
      /executive_execution_authorization_evidence_required/,
    );
  },
);

test(
  "same action cannot be silently authorized twice",
  () => {
    const context =
      createReadyPair();

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    service.authorize({
      action:
        context.action,

      delegation:
        context.delegation,

      actorId:
        context.action.ownerId,
    });

    assert.throws(
      () =>
        service.authorize({
          action:
            context.action,

          delegation:
            context.delegation,

          actorId:
            context.action.ownerId,

          authorizationId:
            "execution-authorization:second",
        }),
      /executive_action_already_execution_authorized/,
    );
  },
);

test(
  "authorization never transitions action to running",
  () => {
    const context =
      createReadyPair();

    const service =
      new ExecutiveActionExecutionAuthorizationService();

    service.authorize({
      action:
        context.action,

      delegation:
        context.delegation,

      actorId:
        context.action.ownerId,
    });

    const action =
      context.actionService
        .get(
          context.action.id,
        );

    assert.equal(
      action?.status,
      "ready",
    );

    assert.notEqual(
      action?.status,
      "running",
    );

    assert.equal(
      action?.startedAt,
      undefined,
    );
  },
);
