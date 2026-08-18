import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveDelegationService,
} from "../../delegation/index.js";

import {
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

import {
  ExecutiveDelegationActionReadinessService,
} from "../ExecutiveDelegationActionReadinessService.js";

function createPair() {
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
        "Implement approved architecture",

      description:
        "Governed delegated work.",
    });

  const action =
    actionService.create({
      id:
        "action:decision:test",

      sessionId:
        "session:test",

      delegationId:
        delegation.id,

      title:
        "Implement approved architecture",

      description:
        "Governed delegated work.",

      ownerId:
        delegation.assignedTo,

      status:
        "planned",

      metadata: {
        decisionId:
          "decision:test",
      },
    });

  return {
    delegationService,
    actionService,
    delegation,
    action,
  };
}

test(
  "explicit acceptance by the assigned owner moves delegation to accepted and action to ready",
  () => {
    const context =
      createPair();

    const service =
      new ExecutiveDelegationActionReadinessService(
        context.delegationService,
        context.actionService,
      );

    const result =
      service.accept({
        delegationId:
          context.delegation.id,

        actionId:
          context.action.id,

        actorId:
          context.delegation.assignedTo,
      });

    assert.equal(
      result.delegation.status,
      "accepted",
    );

    assert.equal(
      result.action.status,
      "ready",
    );

    assert.equal(
      result.action.startedAt,
      undefined,
    );

    assert.equal(
      result.action.completedAt,
      undefined,
    );
  },
);

test(
  "an actor other than the assigned owner cannot accept the delegation",
  () => {
    const context =
      createPair();

    const service =
      new ExecutiveDelegationActionReadinessService(
        context.delegationService,
        context.actionService,
      );

    assert.throws(
      () =>
        service.accept({
          delegationId:
            context.delegation.id,

          actionId:
            context.action.id,

          actorId:
            "agent:other",
        }),
      /executive_delegation_acceptor_not_authorized/,
    );

    assert.equal(
      context.delegationService
        .get(
          context.delegation.id,
        )
        ?.status,
      "assigned",
    );

    assert.equal(
      context.actionService
        .get(
          context.action.id,
        )
        ?.status,
      "planned",
    );
  },
);

test(
  "action must belong to the delegation being accepted",
  () => {
    const context =
      createPair();

    const mismatched =
      context.actionService
        .create({
          id:
            "action:mismatch",

          sessionId:
            "session:test",

          delegationId:
            "delegation:other",

          title:
            "Mismatch",

          description:
            "Wrong delegation.",

          ownerId:
            context.delegation.assignedTo,

          status:
            "planned",
        });

    const service =
      new ExecutiveDelegationActionReadinessService(
        context.delegationService,
        context.actionService,
      );

    assert.throws(
      () =>
        service.accept({
          delegationId:
            context.delegation.id,

          actionId:
            mismatched.id,

          actorId:
            context.delegation.assignedTo,
        }),
      /executive_action_delegation_mismatch/,
    );

    assert.equal(
      context.delegationService
        .get(
          context.delegation.id,
        )
        ?.status,
      "assigned",
    );

    assert.equal(
      context.actionService
        .get(
          mismatched.id,
        )
        ?.status,
      "planned",
    );
  },
);

test(
  "action owner must equal delegation assignee",
  () => {
    const context =
      createPair();

    const wrongOwner =
      context.actionService
        .create({
          id:
            "action:wrong-owner",

          sessionId:
            "session:test",

          delegationId:
            context.delegation.id,

          title:
            "Wrong owner",

          description:
            "Owner mismatch.",

          ownerId:
            "agent:other",

          status:
            "planned",
        });

    const service =
      new ExecutiveDelegationActionReadinessService(
        context.delegationService,
        context.actionService,
      );

    assert.throws(
      () =>
        service.accept({
          delegationId:
            context.delegation.id,

          actionId:
            wrongOwner.id,

          actorId:
            context.delegation.assignedTo,
        }),
      /executive_action_owner_mismatch/,
    );
  },
);

test(
  "cannot accept a delegation twice",
  () => {
    const context =
      createPair();

    const service =
      new ExecutiveDelegationActionReadinessService(
        context.delegationService,
        context.actionService,
      );

    service.accept({
      delegationId:
        context.delegation.id,

      actionId:
        context.action.id,

      actorId:
        context.delegation.assignedTo,
    });

    assert.throws(
      () =>
        service.accept({
          delegationId:
            context.delegation.id,

          actionId:
            context.action.id,

          actorId:
            context.delegation.assignedTo,
        }),
      /executive_delegation_not_assigned/,
    );
  },
);

test(
  "readiness never starts execution",
  () => {
    const context =
      createPair();

    const service =
      new ExecutiveDelegationActionReadinessService(
        context.delegationService,
        context.actionService,
      );

    const result =
      service.accept({
        delegationId:
          context.delegation.id,

        actionId:
          context.action.id,

        actorId:
          context.delegation.assignedTo,
      });

    assert.equal(
      result.action.status,
      "ready",
    );

    assert.notEqual(
      result.action.status,
      "running",
    );

    assert.equal(
      result.action.startedAt,
      undefined,
    );

    assert.equal(
      result.action.completedAt,
      undefined,
    );
  },
);
