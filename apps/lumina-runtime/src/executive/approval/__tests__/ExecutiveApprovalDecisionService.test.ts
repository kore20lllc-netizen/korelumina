import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveDecisionService,
} from "../../decision/index.js";

import {
  ExecutiveApprovalService,
} from "../ExecutiveApprovalService.js";

import {
  ExecutiveApprovalDecisionService,
} from "../ExecutiveApprovalDecisionService.js";

function createGovernedPair() {
  const decisionService =
    new ExecutiveDecisionService();

  const approvalService =
    new ExecutiveApprovalService();

  const decision =
    decisionService.create({
      id:
        "decision:test",

      sessionId:
        "session:test",

      title:
        "Governed decision",

      rationale:
        "Requires human approval.",

      requestedBy:
        "chief-agent",

      status:
        "proposed",
    });

  const approval =
    approvalService.create({
      id:
        "approval:decision:test",

      sessionId:
        decision.sessionId,

      decisionId:
        decision.id,

      requestedBy:
        "chief-agent",

      approverId:
        "human:reviewer",
    });

  return {
    decisionService,
    approvalService,
    decision,
    approval,
  };
}

test(
  "explicit approval transitions both approval and decision consistently",
  () => {
    const {
      decisionService,
      approvalService,
      decision,
      approval,
    } =
      createGovernedPair();

    const service =
      new ExecutiveApprovalDecisionService(
        approvalService,
        decisionService,
      );

    const result =
      service.approve({
        approvalId:
          approval.id,
      });

    assert.equal(
      result.approval.status,
      "approved",
    );

    assert.ok(
      result.approval.decidedAt,
    );

    assert.equal(
      result.decision.status,
      "approved",
    );

    assert.equal(
      result.decision.approvedBy,
      "human:reviewer",
    );

    assert.equal(
      decisionService
        .get(
          decision.id,
        )
        ?.status,
      "approved",
    );

    assert.equal(
      approvalService
        .get(
          approval.id,
        )
        ?.status,
      "approved",
    );
  },
);

test(
  "explicit rejection transitions both approval and decision consistently",
  () => {
    const {
      decisionService,
      approvalService,
      decision,
      approval,
    } =
      createGovernedPair();

    const service =
      new ExecutiveApprovalDecisionService(
        approvalService,
        decisionService,
      );

    const result =
      service.reject({
        approvalId:
          approval.id,

        reason:
          "Architecture review rejected.",
      });

    assert.equal(
      result.approval.status,
      "rejected",
    );

    assert.equal(
      result.approval.comments,
      "Architecture review rejected.",
    );

    assert.ok(
      result.approval.decidedAt,
    );

    assert.equal(
      result.decision.status,
      "rejected",
    );

    assert.equal(
      decisionService
        .get(
          decision.id,
        )
        ?.status,
      "rejected",
    );
  },
);

test(
  "cannot decide the same approval twice",
  () => {
    const {
      decisionService,
      approvalService,
      approval,
    } =
      createGovernedPair();

    const service =
      new ExecutiveApprovalDecisionService(
        approvalService,
        decisionService,
      );

    service.approve({
      approvalId:
        approval.id,
    });

    assert.throws(
      () =>
        service.approve({
          approvalId:
            approval.id,
        }),
      /executive_approval_not_pending/,
    );
  },
);

test(
  "requires rejection reason",
  () => {
    const {
      decisionService,
      approvalService,
      approval,
    } =
      createGovernedPair();

    const service =
      new ExecutiveApprovalDecisionService(
        approvalService,
        decisionService,
      );

    assert.throws(
      () =>
        service.reject({
          approvalId:
            approval.id,

          reason:
            "   ",
        }),
      /executive_approval_rejection_reason_required/,
    );
  },
);
