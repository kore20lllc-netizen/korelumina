import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveDecision,
} from "../../decision/index.js";

import {
  ExecutiveApprovalService,
} from "../ExecutiveApprovalService.js";

import {
  ExecutiveDecisionApprovalRequestService,
} from "../ExecutiveDecisionApprovalRequestService.js";

test(
  "creates a pending approval request for a proposed executive decision",
  () => {
    const approvalService =
      new ExecutiveApprovalService();

    const service =
      new ExecutiveDecisionApprovalRequestService(
        approvalService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:reasoning:event:test",

        sessionId:
          "event:test",

        title:
          "Preserve architecture boundaries",

        rationale:
          "Preserve governed architecture.",

        requestedBy:
          "chief-agent",

        status:
          "proposed",

        evidence: [
          "canonical:test",
        ],

        metadata: {
          reasoningId:
            "reasoning:event:test",
        },
      });

    const approval =
      service.requestApproval({
        decision,

        approverId:
          "human:architecture-reviewer",
      });

    assert.equal(
      approval.id,
      "approval:decision:reasoning:event:test",
    );

    assert.equal(
      approval.decisionId,
      decision.id,
    );

    assert.equal(
      approval.sessionId,
      decision.sessionId,
    );

    assert.equal(
      approval.requestedBy,
      "chief-agent",
    );

    assert.equal(
      approval.approverId,
      "human:architecture-reviewer",
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
      approval.metadata.reasoningId,
      "reasoning:event:test",
    );

    assert.equal(
      approvalService.get(
        approval.id,
      ),
      approval,
    );
  },
);

test(
  "does not allow approval requests for non-proposed decisions",
  () => {
    const service =
      new ExecutiveDecisionApprovalRequestService(
        new ExecutiveApprovalService(),
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:approved",

        sessionId:
          "event:approved",

        title:
          "Already approved",

        rationale:
          "Already decided.",

        requestedBy:
          "chief-agent",

        status:
          "approved",
      });

    assert.throws(
      () =>
        service.requestApproval({
          decision,

          approverId:
            "human:reviewer",
        }),
      /executive_decision_not_proposed/,
    );
  },
);

test(
  "requires an explicit approver",
  () => {
    const service =
      new ExecutiveDecisionApprovalRequestService(
        new ExecutiveApprovalService(),
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:missing-approver",

        sessionId:
          "event:missing-approver",

        title:
          "Needs review",

        rationale:
          "Requires governance.",

        requestedBy:
          "chief-agent",

        status:
          "proposed",
      });

    assert.throws(
      () =>
        service.requestApproval({
          decision,

          approverId:
            "   ",
        }),
      /executive_approval_approver_required/,
    );
  },
);

test(
  "never auto-approves the decision or approval request",
  () => {
    const approvalService =
      new ExecutiveApprovalService();

    const service =
      new ExecutiveDecisionApprovalRequestService(
        approvalService,
      );

    const decision =
      createExecutiveDecision({
        id:
          "decision:governed",

        sessionId:
          "event:governed",

        title:
          "Governed review",

        rationale:
          "Human approval required.",

        requestedBy:
          "chief-agent",

        status:
          "proposed",
      });

    const approval =
      service.requestApproval({
        decision,

        approverId:
          "human:reviewer",
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
  },
);
