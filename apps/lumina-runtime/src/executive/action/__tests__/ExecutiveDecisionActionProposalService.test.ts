import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveDecision,
} from "../../decision/index.js";

import {
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

import {
  ExecutiveDecisionActionProposalService,
} from "../ExecutiveDecisionActionProposalService.js";

test(
  "creates a planned action proposal from an approved decision",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDecisionActionProposalService(
        actionService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:approved",

        sessionId:
          "session:approved",

        title:
          "Preserve architecture boundaries",

        rationale:
          "Implement the approved governance direction.",

        requestedBy:
          "chief-agent",

        approvedBy:
          "human:architecture-reviewer",

        status:
          "approved",

        evidence: [
          "canonical:architecture",
        ],

        consequences: [
          "Architecture boundary becomes enforceable.",
        ],

        metadata: {
          reasoningId:
            "reasoning:event:approved",
        },
      });

    const action =
      service.propose({
        decision,

        ownerId:
          "agent:architecture-engineer",
      });

    assert.equal(
      action.id,
      "action:decision:approved",
    );

    assert.equal(
      action.sessionId,
      decision.sessionId,
    );

    assert.equal(
      action.status,
      "planned",
    );

    assert.equal(
      action.ownerId,
      "agent:architecture-engineer",
    );

    assert.equal(
      action.startedAt,
      undefined,
    );

    assert.equal(
      action.completedAt,
      undefined,
    );

    assert.equal(
      action.metadata.decisionId,
      decision.id,
    );

    assert.equal(
      action.metadata.approvedBy,
      "human:architecture-reviewer",
    );

    assert.deepEqual(
      action.metadata.decisionEvidence,
      decision.evidence,
    );

    assert.equal(
      actionService.get(
        action.id,
      ),
      action,
    );
  },
);

test(
  "does not create an action proposal from a proposed decision",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDecisionActionProposalService(
        actionService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:proposed",

        sessionId:
          "session:proposed",

        title:
          "Pending decision",

        rationale:
          "Still awaiting approval.",

        requestedBy:
          "chief-agent",

        status:
          "proposed",
      });

    assert.throws(
      () =>
        service.propose({
          decision,

          ownerId:
            "agent:executor",
        }),
      /executive_decision_not_approved/,
    );

    assert.deepEqual(
      actionService.list(),
      [],
    );
  },
);

test(
  "does not create an action proposal from a rejected decision",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDecisionActionProposalService(
        actionService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:rejected",

        sessionId:
          "session:rejected",

        title:
          "Rejected decision",

        rationale:
          "Human governance rejected this direction.",

        requestedBy:
          "chief-agent",

        status:
          "rejected",
      });

    assert.throws(
      () =>
        service.propose({
          decision,

          ownerId:
            "agent:executor",
        }),
      /executive_decision_not_approved/,
    );

    assert.deepEqual(
      actionService.list(),
      [],
    );
  },
);

test(
  "requires an explicit action owner",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDecisionActionProposalService(
        actionService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:owner-required",

        sessionId:
          "session:owner-required",

        title:
          "Approved decision",

        rationale:
          "Requires assignment.",

        requestedBy:
          "chief-agent",

        approvedBy:
          "human:reviewer",

        status:
          "approved",
      });

    assert.throws(
      () =>
        service.propose({
          decision,

          ownerId:
            "   ",
        }),
      /executive_action_owner_required/,
    );

    assert.deepEqual(
      actionService.list(),
      [],
    );
  },
);

test(
  "never starts or completes the proposed action",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDecisionActionProposalService(
        actionService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:no-execution",

        sessionId:
          "session:no-execution",

        title:
          "Approved but not executable yet",

        rationale:
          "Only planning is authorized.",

        requestedBy:
          "chief-agent",

        approvedBy:
          "human:reviewer",

        status:
          "approved",
      });

    const action =
      service.propose({
        decision,

        ownerId:
          "agent:executor",
      });

    assert.equal(
      action.status,
      "planned",
    );

    assert.equal(
      action.startedAt,
      undefined,
    );

    assert.equal(
      action.completedAt,
      undefined,
    );
  },
);
