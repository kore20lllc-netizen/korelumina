import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveDecision,
} from "../../decision/index.js";

import {
  ExecutiveDelegationService,
} from "../ExecutiveDelegationService.js";

import {
  ExecutiveDecisionDelegationService,
} from "../ExecutiveDecisionDelegationService.js";

function createApprovedDecision() {
  return createExecutiveDecision({
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
}

test(
  "creates an assigned delegation from an approved decision",
  () => {
    const delegationService =
      new ExecutiveDelegationService();

    const service =
      new ExecutiveDecisionDelegationService(
        delegationService,
      );

    const decision =
      createApprovedDecision();

    const delegation =
      service.delegate({
        decision,

        assignedBy:
          "human:architecture-reviewer",

        assignedTo:
          "agent:architecture-engineer",

        priority:
          "high",
      });

    assert.equal(
      delegation.id,
      "delegation:decision:approved",
    );

    assert.equal(
      delegation.decisionId,
      decision.id,
    );

    assert.equal(
      delegation.sessionId,
      decision.sessionId,
    );

    assert.equal(
      delegation.assignedBy,
      "human:architecture-reviewer",
    );

    assert.equal(
      delegation.assignedTo,
      "agent:architecture-engineer",
    );

    assert.equal(
      delegation.status,
      "assigned",
    );

    assert.equal(
      delegation.priority,
      "high",
    );

    assert.equal(
      delegation.metadata.decisionId,
      decision.id,
    );

    assert.equal(
      delegation.metadata.approvedBy,
      "human:architecture-reviewer",
    );

    assert.equal(
      delegationService.get(
        delegation.id,
      ),
      delegation,
    );
  },
);

test(
  "does not delegate a proposed decision",
  () => {
    const delegationService =
      new ExecutiveDelegationService();

    const service =
      new ExecutiveDecisionDelegationService(
        delegationService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:proposed",

        sessionId:
          "session:proposed",

        title:
          "Pending",

        rationale:
          "Awaiting approval.",

        requestedBy:
          "chief-agent",

        status:
          "proposed",
      });

    assert.throws(
      () =>
        service.delegate({
          decision,

          assignedBy:
            "human:reviewer",

          assignedTo:
            "agent:executor",
        }),
      /executive_decision_not_approved/,
    );

    assert.deepEqual(
      delegationService.list(),
      [],
    );
  },
);

test(
  "does not delegate a rejected decision",
  () => {
    const delegationService =
      new ExecutiveDelegationService();

    const service =
      new ExecutiveDecisionDelegationService(
        delegationService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:rejected",

        sessionId:
          "session:rejected",

        title:
          "Rejected",

        rationale:
          "Governance rejected this decision.",

        requestedBy:
          "chief-agent",

        status:
          "rejected",
      });

    assert.throws(
      () =>
        service.delegate({
          decision,

          assignedBy:
            "human:reviewer",

          assignedTo:
            "agent:executor",
        }),
      /executive_decision_not_approved/,
    );

    assert.deepEqual(
      delegationService.list(),
      [],
    );
  },
);

test(
  "requires an explicit assigner",
  () => {
    const delegationService =
      new ExecutiveDelegationService();

    const service =
      new ExecutiveDecisionDelegationService(
        delegationService,
      );

    assert.throws(
      () =>
        service.delegate({
          decision:
            createApprovedDecision(),

          assignedBy:
            "   ",

          assignedTo:
            "agent:executor",
        }),
      /executive_delegation_assigner_required/,
    );

    assert.deepEqual(
      delegationService.list(),
      [],
    );
  },
);

test(
  "requires an explicit assignee",
  () => {
    const delegationService =
      new ExecutiveDelegationService();

    const service =
      new ExecutiveDecisionDelegationService(
        delegationService,
      );

    assert.throws(
      () =>
        service.delegate({
          decision:
            createApprovedDecision(),

          assignedBy:
            "human:reviewer",

          assignedTo:
            "   ",
        }),
      /executive_delegation_assignee_required/,
    );

    assert.deepEqual(
      delegationService.list(),
      [],
    );
  },
);

test(
  "delegation does not start execution",
  () => {
    const delegationService =
      new ExecutiveDelegationService();

    const service =
      new ExecutiveDecisionDelegationService(
        delegationService,
      );

    const delegation =
      service.delegate({
        decision:
          createApprovedDecision(),

        assignedBy:
          "human:architecture-reviewer",

        assignedTo:
          "agent:architecture-engineer",
      });

    assert.equal(
      delegation.status,
      "assigned",
    );

    assert.notEqual(
      delegation.status,
      "in-progress",
    );

    assert.notEqual(
      delegation.status,
      "completed",
    );
  },
);
