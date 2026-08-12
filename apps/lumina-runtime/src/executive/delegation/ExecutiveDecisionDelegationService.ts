import type {
  ExecutiveDecision,
} from "../decision/index.js";

import {
  ExecutiveDelegationService,
} from "./ExecutiveDelegationService.js";

import type {
  ExecutiveDelegation,
} from "./ExecutiveDelegation.js";

export interface DelegateApprovedExecutiveDecisionInput {
  decision:
    ExecutiveDecision;

  assignedBy:
    string;

  assignedTo:
    string;

  priority?:
    "low"
    | "normal"
    | "high"
    | "critical";

  dueAt?:
    number;
}

export class ExecutiveDecisionDelegationService {
  constructor(
    private readonly delegationService =
      new ExecutiveDelegationService(),
  ) {}

  delegate(
    input:
      DelegateApprovedExecutiveDecisionInput,
  ): ExecutiveDelegation {
    const {
      decision,
    } = input;

    if (
      decision.status !==
      "approved"
    ) {
      throw new Error(
        "executive_decision_not_approved",
      );
    }

    if (
      decision.evidence.length ===
      0
    ) {
      throw new Error(
        "executive_decision_evidence_required_for_delegation",
      );
    }

    const assignedBy =
      input.assignedBy.trim();

    if (
      assignedBy.length ===
      0
    ) {
      throw new Error(
        "executive_delegation_assigner_required",
      );
    }

    const assignedTo =
      input.assignedTo.trim();

    if (
      assignedTo.length ===
      0
    ) {
      throw new Error(
        "executive_delegation_assignee_required",
      );
    }

    return this.delegationService
      .create({
        id:
          `delegation:${decision.id}`,

        sessionId:
          decision.sessionId,

        decisionId:
          decision.id,

        assignedBy,

        assignedTo,

        title:
          decision.title,

        description:
          decision.rationale,

        priority:
          input.priority,

        dueAt:
          input.dueAt,

        metadata: {
          decisionId:
            decision.id,

          decisionStatus:
            decision.status,

          approvedBy:
            decision.approvedBy,

          decisionEvidence:
            decision.evidence,

          decisionConsequences:
            decision.consequences,

          ...decision.metadata,
        },
      });
  }
}
