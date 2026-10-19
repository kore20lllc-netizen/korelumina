import {
  ExecutiveDestinationSkip,
  type ExecutiveDispatchContext,
} from "../orchestrator/index.js";

import type {
  ChiefAgentGovernedContentReader,
} from "./ChiefAgentGovernedContentReader.js";
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

  approverId?: string;

  knowledge:
    ChiefAgentReasoningKnowledge;
}

export type ChiefAgentReasoningDisposition =
  | "authorize"
  | "review"
  | "deny";

export interface ChiefAgentReasoningResult {
  title: string;

  disposition:
    ChiefAgentReasoningDisposition;

  conclusion: string;

  confidence: number;

  evidence:
    readonly string[];

  assumptions:
    readonly string[];

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export interface ChiefAgentReasoningProvider {
  reason(
    input:
      ChiefAgentReasoningInput,
  ):
    Promise<ChiefAgentReasoningResult>;
}

export class ChiefAgentReasoningDestinationAdapter {
  constructor(
    private readonly materializer:
      ChiefAgentReasoningKnowledgeMaterializer,

    private readonly provider?:
      ChiefAgentReasoningProvider,

    private readonly contentReader?:
      ChiefAgentGovernedContentReader,
  ) {}

  async handle(
    dispatchContext:
      ExecutiveDispatchContext,
  ): Promise<void> {
    const actor =
      dispatchContext
        .event
        .actor;

    /*
     * KO-6 (F-21): the Chief Agent reasons on its own events and on
     * requests from a person. Anything else is skipped, and says so.
     */
    if (
      actor.type !==
        "chief-agent" &&
      actor.type !==
        "human"
    ) {
      throw new ExecutiveDestinationSkip(
        `chief_agent_reasoning_not_requested_by_actor_type:${actor.type}`,
      );
    }

    if (
      !this.provider
    ) {
      throw new ExecutiveDestinationSkip(
        "chief_agent_reasoning_provider_not_configured",
      );
    }

    const requestedApprover =
      typeof dispatchContext
        .event
        .payload
        .approverId === "string"
        ? dispatchContext
            .event
            .payload
            .approverId
            .trim() || undefined
        : undefined;

    /*
     * A person who asks gets the proposal back for their own approval
     * unless they name another approver.
     */
    const approverId =
      requestedApprover ??
      (
        actor.type ===
          "human" &&
        actor.id.trim()
          ? actor.id.trim()
          : undefined
      );

    const materialized =
      this.materializer
        .materialize(
          dispatchContext.context,
        );

    const query =
      typeof dispatchContext
        .event
        .payload
        .query === "string"
        ? dispatchContext
            .event
            .payload
            .query
        : undefined;

    const knowledge =
      this.contentReader
        ? {
            ...materialized,
            governedContent:
              this.contentReader.read(
                materialized.canonicalKnowledge,
                query,
              ),
          }
        : materialized;

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

      query,

      approverId,

      knowledge,
    });
  }
}
