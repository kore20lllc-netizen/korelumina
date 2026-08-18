import type {
  ExecutiveDecision,
} from "../decision/index.js";

import {
  ExecutiveApprovalService,
} from "./ExecutiveApprovalService.js";

import type {
  ExecutiveApproval,
} from "./ExecutiveApproval.js";

export interface RequestExecutiveDecisionApprovalInput {
  decision:
    ExecutiveDecision;

  approverId:
    string;

  requestedBy?:
    string;
}

export class ExecutiveDecisionApprovalRequestService {
  constructor(
    private readonly approvalService =
      new ExecutiveApprovalService(),
  ) {}

  requestApproval(
    input:
      RequestExecutiveDecisionApprovalInput,
  ): ExecutiveApproval {
    const {
      decision,
      approverId,
    } = input;

    if (
      decision.status !==
      "proposed"
    ) {
      throw new Error(
        "executive_decision_not_proposed",
      );
    }

    const normalizedApproverId =
      approverId.trim();

    if (
      normalizedApproverId.length === 0
    ) {
      throw new Error(
        "executive_approval_approver_required",
      );
    }

    return this.approvalService
      .create({
        id:
          `approval:${decision.id}`,

        sessionId:
          decision.sessionId,

        decisionId:
          decision.id,

        requestedBy:
          input.requestedBy?.trim() ||
          decision.requestedBy,

        approverId:
          normalizedApproverId,

        metadata: {
          decisionStatus:
            decision.status,

          decisionTitle:
            decision.title,

          ...decision.metadata,
        },
      });
  }
}
