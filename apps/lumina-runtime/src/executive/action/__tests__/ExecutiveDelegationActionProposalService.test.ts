import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveDecision,
} from "../../decision/index.js";

import {
  createExecutiveDelegation,
} from "../../delegation/index.js";

import {
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

import {
  ExecutiveDecisionActionProposalService,
} from "../ExecutiveDecisionActionProposalService.js";

import {
  ExecutiveDelegationActionProposalService,
} from "../ExecutiveDelegationActionProposalService.js";

function createApprovedDecision(
  id =
    "decision:approved",
) {
  return createExecutiveDecision({
    id,

    sessionId:
      "session:governed",

    title:
      "Preserve architecture boundaries",

    rationale:
      "Implement approved governance direction.",

    requestedBy:
      "chief-agent",

    approvedBy:
      "human:architecture-reviewer",

    status:
      "approved",

    evidence: [
      "canonical:architecture",
    ],

    metadata: {
      reasoningId:
        "reasoning:event:approved",
    },
  });
}

function createAssignedDelegation(
  decisionId =
    "decision:approved",
) {
  return createExecutiveDelegation({
    id:
      `delegation:${decisionId}`,

    sessionId:
      "session:governed",

    decisionId,

    assignedBy:
      "human:architecture-reviewer",

    assignedTo:
      "agent:architecture-engineer",

    title:
      "Preserve architecture boundaries",

    description:
      "Implement approved governance direction.",
  });
}

test(
  "creates a planned action owned by the delegation assignee",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDelegationActionProposalService(
        new ExecutiveDecisionActionProposalService(
          actionService,
        ),
      );

    const decision =
      createApprovedDecision();

    const delegation =
      createAssignedDelegation();

    const action =
      service.propose({
        decision,
        delegation,
      });

    assert.equal(
      action.id,
      `action:${decision.id}`,
    );

    assert.equal(
      action.status,
      "planned",
    );

    assert.equal(
      action.ownerId,
      delegation.assignedTo,
    );

    assert.equal(
      action.delegationId,
      delegation.id,
    );

    assert.equal(
      action.metadata.decisionId,
      decision.id,
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

test(
  "rejects a delegation belonging to another decision",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDelegationActionProposalService(
        new ExecutiveDecisionActionProposalService(
          actionService,
        ),
      );

    assert.throws(
      () =>
        service.propose({
          decision:
            createApprovedDecision(
              "decision:one",
            ),

          delegation:
            createAssignedDelegation(
              "decision:two",
            ),
        }),
      /executive_delegation_decision_mismatch/,
    );

    assert.deepEqual(
      actionService.list(),
      [],
    );
  },
);

test(
  "rejects a delegation that is no longer assigned",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDelegationActionProposalService(
        new ExecutiveDecisionActionProposalService(
          actionService,
        ),
      );

    const delegation =
      Object.freeze({
        ...createAssignedDelegation(),

        status:
          "accepted" as const,
      });

    assert.throws(
      () =>
        service.propose({
          decision:
            createApprovedDecision(),

          delegation,
        }),
      /executive_delegation_not_assigned/,
    );

    assert.deepEqual(
      actionService.list(),
      [],
    );
  },
);

test(
  "rejects a non-approved decision",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDelegationActionProposalService(
        new ExecutiveDecisionActionProposalService(
          actionService,
        ),
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:proposed",

        sessionId:
          "session:governed",

        title:
          "Pending decision",

        rationale:
          "Awaiting approval.",

        requestedBy:
          "chief-agent",

        status:
          "proposed",
      });

    assert.throws(
      () =>
        service.propose({
          decision,

          delegation:
            createAssignedDelegation(
              decision.id,
            ),
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
  "never advances the action beyond planned",
  () => {
    const actionService =
      new ExecutiveActionService();

    const service =
      new ExecutiveDelegationActionProposalService(
        new ExecutiveDecisionActionProposalService(
          actionService,
        ),
      );

    const action =
      service.propose({
        decision:
          createApprovedDecision(),

        delegation:
          createAssignedDelegation(),
      });

    assert.equal(
      action.status,
      "planned",
    );

    assert.notEqual(
      action.status,
      "ready",
    );

    assert.notEqual(
      action.status,
      "running",
    );

    assert.equal(
      action.startedAt,
      undefined,
    );
  },
);
