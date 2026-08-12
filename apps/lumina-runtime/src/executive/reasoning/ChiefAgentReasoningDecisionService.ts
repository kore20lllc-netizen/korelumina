import type {
  ExecutiveDecision,
} from "../decision/index.js";

import {
  ExecutiveDecisionService,
} from "../decision/index.js";

import type {
  ExecutiveReasoning,
} from "./ExecutiveReasoning.js";

export interface CreateChiefAgentDecisionInput {
  reasoning:
    ExecutiveReasoning;

  requestedBy:
    string;
}

export class ChiefAgentReasoningDecisionService {
  constructor(
    private readonly decisionService =
      new ExecutiveDecisionService(),
  ) {}

  createProposedDecision(
    input:
      CreateChiefAgentDecisionInput,
  ): ExecutiveDecision {
    const {
      reasoning,
      requestedBy,
    } = input;

    if (
      reasoning.status !==
      "completed"
    ) {
      throw new Error(
        "chief_agent_reasoning_not_completed",
      );
    }

    return this.decisionService
      .create({
        id:
          `decision:${reasoning.id}`,

        sessionId:
          reasoning.sessionId,

        title:
          reasoning.title,

        rationale:
          reasoning.conclusion,

        requestedBy,

        status:
          "proposed",

        evidence:
          reasoning.evidence,

        consequences:
          reasoning.assumptions,

        metadata: {
          reasoningId:
            reasoning.id,

          reasoningConfidence:
            reasoning.confidence,

          reasoningQuestion:
            reasoning.question,

          ...reasoning.metadata,
        },
      });
  }
}
