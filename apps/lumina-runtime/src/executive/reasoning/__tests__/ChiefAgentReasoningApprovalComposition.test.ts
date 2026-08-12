import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveApprovalService,
  ExecutiveDecisionApprovalRequestService,
} from "../../approval/index.js";

import {
  ExecutiveDecisionService,
} from "../../decision/index.js";

import {
  createExecutiveReasoning,
} from "../ExecutiveReasoning.js";

import {
  ChiefAgentReasoningDecisionService,
} from "../ChiefAgentReasoningDecisionService.js";

function createCompletedReasoning(
  id: string,
) {
  return createExecutiveReasoning({
    id,

    sessionId:
      id.replace(
        "reasoning:",
        "",
      ),

    title:
      "Governed decision",

    question:
      "What should happen?",

    conclusion:
      "Submit the proposal for review.",

    confidence:
      0.95,

    evidence: [
      "canonical:test",
    ],

    assumptions: [
      "Human approval remains required.",
    ],

    status:
      "completed",
  });
}

test(
  "explicit approver produces a pending approval request for the proposed decision",
  () => {
    const decisionService =
      new ExecutiveDecisionService();

    const approvalService =
      new ExecutiveApprovalService();

    const decisionAdapter =
      new ChiefAgentReasoningDecisionService(
        decisionService,
      );

    const approvalAdapter =
      new ExecutiveDecisionApprovalRequestService(
        approvalService,
      );

    const reasoning =
      createCompletedReasoning(
        "reasoning:event:approval",
      );

    const decision =
      decisionAdapter
        .createProposedDecision({
          reasoning,

          requestedBy:
            "chief-agent",
        });

    const approval =
      approvalAdapter
        .requestApproval({
          decision,

          approverId:
            "human:architecture-reviewer",

          requestedBy:
            "chief-agent",
        });

    assert.equal(
      decision.status,
      "proposed",
    );

    assert.equal(
      decision.approvedBy,
      undefined,
    );

    assert.equal(
      approval.status,
      "pending",
    );

    assert.equal(
      approval.decidedAt,
      undefined,
    );

    assert.equal(
      approval.decisionId,
      decision.id,
    );

    assert.equal(
      approval.approverId,
      "human:architecture-reviewer",
    );
  },
);

test(
  "absence of an approver leaves the workflow at proposed decision only",
  () => {
    const decisionService =
      new ExecutiveDecisionService();

    const approvalService =
      new ExecutiveApprovalService();

    const decisionAdapter =
      new ChiefAgentReasoningDecisionService(
        decisionService,
      );

    const reasoning =
      createCompletedReasoning(
        "reasoning:event:no-approval",
      );

    const decision =
      decisionAdapter
        .createProposedDecision({
          reasoning,

          requestedBy:
            "chief-agent",
        });

    assert.equal(
      decision.status,
      "proposed",
    );

    assert.equal(
      decision.approvedBy,
      undefined,
    );

    assert.deepEqual(
      approvalService.list(),
      [],
    );
  },
);
