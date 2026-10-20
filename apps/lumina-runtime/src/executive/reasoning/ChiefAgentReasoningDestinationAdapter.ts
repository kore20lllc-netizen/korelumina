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
import type {
  MissionProposal,
} from "../mission/MissionProposal.js";
import type {
  ChiefAgentOperationalState,
  ChiefAgentOperationalStateReader,
} from "./ChiefAgentOperationalState.js";

export interface ChiefAgentReasoningInput {
  eventId: string;

  eventType: string;

  organizationId?: string;

  projectId?: string;

  query?: string;

  approverId?: string;

  knowledge:
    ChiefAgentReasoningKnowledge;

  /*
   * EW-2 (F-24): what is happening on the platform right now. Context for
   * questions about current state; never knowledge, never authority.
   */
  operationalState?:
    ChiefAgentOperationalState;
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

  /*
   * MS-3 (ADR-0044): an optional mission or plan proposal, already
   * validated. It becomes a mission awaiting the owner's approval.
   */
  missionProposal?:
    MissionProposal;

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

    private readonly operationalStateReader?:
      ChiefAgentOperationalStateReader,
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

    let operationalState:
      ChiefAgentOperationalState | undefined;

    if (this.operationalStateReader) {
      try {
        operationalState =
          this.operationalStateReader.read();
      } catch (error) {
        operationalState = {
          capturedAt:
            new Date().toISOString(),
          entries: [],
          unavailable: [
            `operational state: ${error instanceof Error ? error.message : String(error)}`,
          ],
        };
      }
    }

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

      ...(operationalState
        ? { operationalState }
        : {}),
    });
  }
}
