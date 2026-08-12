import {
  ExecutiveDecisionService,
  type ExecutiveDecision,
} from "../decision/index.js";

import {
  ExecutiveApprovalService,
} from "./ExecutiveApprovalService.js";

import type {
  ExecutiveApproval,
} from "./ExecutiveApproval.js";

export interface ApproveExecutiveDecisionInput {
  approvalId:
    string;
}

export interface RejectExecutiveDecisionInput {
  approvalId:
    string;

  reason:
    string;
}

export interface ExecutiveApprovalDecisionResult {
  approval:
    ExecutiveApproval;

  decision:
    ExecutiveDecision;
}

export class ExecutiveApprovalDecisionService {
  constructor(
    private readonly approvalService:
      ExecutiveApprovalService,

    private readonly decisionService:
      ExecutiveDecisionService,
  ) {}

  approve(
    input:
      ApproveExecutiveDecisionInput,
  ): ExecutiveApprovalDecisionResult {
    const pending =
      this.requirePendingApproval(
        input.approvalId,
      );

    const decision =
      this.requireProposedDecision(
        pending.decisionId,
      );

    const approval =
      this.approvalService
        .approve(
          pending.id,
        );

    const approvedDecision =
      this.decisionService
        .approve(
          decision.id,
          pending.approverId,
        );

    return {
      approval,
      decision:
        approvedDecision,
    };
  }

  reject(
    input:
      RejectExecutiveDecisionInput,
  ): ExecutiveApprovalDecisionResult {
    const reason =
      input.reason.trim();

    if (
      reason.length === 0
    ) {
      throw new Error(
        "executive_approval_rejection_reason_required",
      );
    }

    const pending =
      this.requirePendingApproval(
        input.approvalId,
      );

    const decision =
      this.requireProposedDecision(
        pending.decisionId,
      );

    const approval =
      this.approvalService
        .reject(
          pending.id,
          reason,
        );

    const rejectedDecision =
      this.decisionService
        .reject(
          decision.id,
          pending.approverId,
          reason,
        );

    return {
      approval,
      decision:
        rejectedDecision,
    };
  }

  private requirePendingApproval(
    approvalId: string,
  ): ExecutiveApproval {
    const approval =
      this.approvalService
        .get(
          approvalId,
        );

    if (
      !approval
    ) {
      throw new Error(
        "executive_approval_not_found",
      );
    }

    if (
      approval.status !==
      "pending"
    ) {
      throw new Error(
        "executive_approval_not_pending",
      );
    }

    return approval;
  }

  private requireProposedDecision(
    decisionId: string,
  ): ExecutiveDecision {
    const decision =
      this.decisionService
        .get(
          decisionId,
        );

    if (
      !decision
    ) {
      throw new Error(
        "executive_decision_not_found",
      );
    }

    if (
      decision.status !==
      "proposed"
    ) {
      throw new Error(
        "executive_decision_not_proposed",
      );
    }

    return decision;
  }
}
