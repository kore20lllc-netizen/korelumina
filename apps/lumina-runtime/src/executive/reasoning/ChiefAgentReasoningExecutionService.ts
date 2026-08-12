import {
  ExecutiveReasoningService,
} from "./ExecutiveReasoningService.js";

import type {
  ChiefAgentReasoningInput,
  ChiefAgentReasoningProvider,
} from "./ChiefAgentReasoningDestinationAdapter.js";

export class ChiefAgentReasoningExecutionService {
  constructor(
    private readonly provider:
      ChiefAgentReasoningProvider,

    private readonly reasoningService:
      ExecutiveReasoningService,
  ) {}

  async execute(
    input:
      ChiefAgentReasoningInput,
  ): Promise<void> {
    const result =
      await this.provider.reason(
        input,
      );

    this.reasoningService.create({
      id:
        `reasoning:${input.eventId}`,

      sessionId:
        input.eventId,

      title:
        result.title,

      question:
        input.query ??
        input.eventType,

      conclusion:
        result.conclusion,

      confidence:
        result.confidence,

      evidence:
        result.evidence,

      assumptions:
        result.assumptions,

      status:
        "completed",

      metadata: {
        organizationId:
          input.organizationId,

        projectId:
          input.projectId,

        canonicalKnowledgeIds:
          input.knowledge
            .canonicalKnowledge
            .map(
              (item) => item.id,
            ),

        organizationalMemoryRecordIds:
          input.knowledge
            .organizationalMemory
            .map(
              (record) => record.id,
            ),

        ...(result.metadata ?? {}),
      },
    });
  }
}
