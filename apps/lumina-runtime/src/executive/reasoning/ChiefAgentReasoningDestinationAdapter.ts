import type {
  ExecutiveDispatchContext,
} from "../orchestrator/index.js";

import {
  ChiefAgentReasoningKnowledgeMaterializer,
  type ChiefAgentReasoningKnowledge,
} from "./ChiefAgentReasoningKnowledgeMaterializer.js";

export interface ChiefAgentReasoningInput {
  eventId: string;

  eventType: string;

  organizationId?: string;

  projectId?: string;

  query?: string;

  knowledge:
    ChiefAgentReasoningKnowledge;
}

export interface ChiefAgentReasoningProvider {
  reason(
    input:
      ChiefAgentReasoningInput,
  ):
    void | Promise<void>;
}

export class ChiefAgentReasoningDestinationAdapter {
  constructor(
    private readonly materializer:
      ChiefAgentReasoningKnowledgeMaterializer,

    private readonly provider?:
      ChiefAgentReasoningProvider,
  ) {}

  async handle(
    dispatchContext:
      ExecutiveDispatchContext,
  ): Promise<void> {
    if (
      dispatchContext
        .event
        .actor
        .type !==
      "chief-agent"
    ) {
      return;
    }

    if (
      !this.provider
    ) {
      return;
    }

    const knowledge =
      this.materializer
        .materialize(
          dispatchContext.context,
        );

    await this.provider.reason({
      eventId:
        dispatchContext.event.id,

      eventType:
        dispatchContext.event.type,

      organizationId:
        dispatchContext.context
          .organizationId,

      projectId:
        dispatchContext.context
          .project
          ?.id,

      query:
        typeof dispatchContext
          .event
          .payload
          .query === "string"
          ? dispatchContext
              .event
              .payload
              .query
          : undefined,

      knowledge,
    });
  }
}
