import type {
  ExecutiveDecision,
} from "../decision/index.js";

import type {
  ExecutiveDelegation,
} from "../delegation/index.js";

import {
  ExecutiveDecisionActionProposalService,
} from "./ExecutiveDecisionActionProposalService.js";

import type {
  ExecutiveAction,
} from "./ExecutiveAction.js";

export interface ProposeDelegatedExecutiveActionInput {
  decision:
    ExecutiveDecision;

  delegation:
    ExecutiveDelegation;
}

export class ExecutiveDelegationActionProposalService {
  constructor(
    private readonly actionProposalService =
      new ExecutiveDecisionActionProposalService(),
  ) {}

  propose(
    input:
      ProposeDelegatedExecutiveActionInput,
  ): ExecutiveAction {
    const {
      decision,
      delegation,
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
      delegation.status !==
      "assigned"
    ) {
      throw new Error(
        "executive_delegation_not_assigned",
      );
    }

    if (
      delegation.decisionId !==
      decision.id
    ) {
      throw new Error(
        "executive_delegation_decision_mismatch",
      );
    }

    const assignedTo =
      delegation.assignedTo.trim();

    if (
      assignedTo.length ===
      0
    ) {
      throw new Error(
        "executive_delegation_assignee_required",
      );
    }

    return this.actionProposalService
      .propose({
        decision,

        ownerId:
          assignedTo,

        delegationId:
          delegation.id,
      });
  }
}
