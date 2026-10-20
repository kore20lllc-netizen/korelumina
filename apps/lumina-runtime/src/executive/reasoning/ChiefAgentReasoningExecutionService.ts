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

      disposition:
        result.disposition,

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

        ...(input.knowledge
          .governedContent
          ? {
              governedContent: {
                includedIds:
                  input.knowledge
                    .governedContent
                    .included
                    .map(
                      (entry) => entry.id,
                    ),
                truncatedIds:
                  input.knowledge
                    .governedContent
                    .included
                    .filter(
                      (entry) =>
                        entry.truncated,
                    )
                    .map(
                      (entry) => entry.id,
                    ),
                excluded:
                  input.knowledge
                    .governedContent
                    .excluded,
              },
            }
          : {}),
        ...(input.operationalState
          ? {
              operationalState: {
                capturedAt:
                  input.operationalState.capturedAt,
                entryIds:
                  input.operationalState.entries.map(
                    (entry) => entry.id,
                  ),
                unavailable:
                  input.operationalState.unavailable,
              },
            }
          : {}),
        ...(result.metadata ?? {}),
        ...(result.missionProposal
          ? {
              missionProposal:
                result.missionProposal,
            }
          : {}),
      },
    });
  }
}
