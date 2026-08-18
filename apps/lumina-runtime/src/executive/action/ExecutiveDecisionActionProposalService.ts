import type {
  ExecutiveDecision,
} from "../decision/index.js";

import {
  ExecutiveActionService,
} from "./ExecutiveActionService.js";

import type {
  ExecutiveAction,
} from "./ExecutiveAction.js";

export interface ProposeExecutiveActionInput {
  decision:
    ExecutiveDecision;

  ownerId:
    string;

  delegationId?:
    string;
}

export class ExecutiveDecisionActionProposalService {
  constructor(
    private readonly actionService =
      new ExecutiveActionService(),
  ) {}

  propose(
    input:
      ProposeExecutiveActionInput,
  ): ExecutiveAction {
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

    const ownerId =
      input.ownerId.trim();

    if (
      ownerId.length ===
      0
    ) {
      throw new Error(
        "executive_action_owner_required",
      );
    }

    const delegationId =
      input.delegationId
        ?.trim() ||
      undefined;

    return this.actionService
      .create({
        id:
          `action:${decision.id}`,

        sessionId:
          decision.sessionId,

        delegationId,

        title:
          decision.title,

        description:
          decision.rationale,

        ownerId,

        status:
          "planned",

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
