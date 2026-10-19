import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import type {
  ExecutiveReasoningStore,
} from "./FileExecutiveReasoningStore.js";
import {
  createExecutiveReasoning,
  type CreateExecutiveReasoningInput,
  type ExecutiveReasoning,
  type ExecutiveReasoningStatus,
} from "./ExecutiveReasoning.js";

export class ExecutiveReasoningService {

  private readonly reasoning =
    new Map<
      string,
      ExecutiveReasoning
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),

    /*
     * KO-6 (F-23): optional persistent store; without one, reasoning
     * stays in memory as before.
     */
    private readonly store?:
      ExecutiveReasoningStore,
  ) {}

  create(
    input:
      CreateExecutiveReasoningInput,
  ): ExecutiveReasoning {

    const result =
      createExecutiveReasoning(
        input,
      );

    this.reasoning.set(
      result.id,
      result,
    );

    this.store?.save(
      result,
    );

    this.timeline.record({
      id:
        `${result.id}:created`,
      sessionId:
        result.sessionId,
      type:
        "reflection",
      actorId:
        "chief-agent",
      source:
        "executive-reasoning",
      title:
        result.title,
      summary:
        result.question,
      payload: {
        reasoningId:
          result.id,
          confidence:
          result.confidence,
      },
    });

    return result;
  }

  updateStatus(
    reasoningId: string,
    status:
      ExecutiveReasoningStatus,
  ): ExecutiveReasoning {

    const existing =
      this.get(
        reasoningId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive reasoning "${reasoningId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.reasoning.set(
      reasoningId,
      updated,
    );

    this.store?.save(
      updated,
    );

    this.timeline.record({
      id:
        `${reasoningId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "reflection",
      actorId:
        "chief-agent",
      source:
        "executive-reasoning",
      title:
        updated.title,
      summary:
        `Reasoning status changed to ${status}.`,
      payload: {
        reasoningId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ): ExecutiveReasoning | undefined {
    const cached =
      this.reasoning.get(
        id,
      );

    if (
      cached ||
      !this.store
    ) {
      return cached;
    }

    const stored =
      this.store.load(
        id,
      );

    if (
      stored
    ) {
      this.reasoning.set(
        id,
        stored,
      );
    }

    return stored ?? undefined;
  }

  list() {
    if (
      this.store
    ) {
      for (
        const stored
        of this.store.list()
      ) {
        if (
          !this.reasoning.has(
            stored.id,
          )
        ) {
          this.reasoning.set(
            stored.id,
            stored,
          );
        }
      }
    }

    return Object.freeze(
      Array.from(
        this.reasoning.values(),
      ),
    );
  }

  clear(): void {
    this.reasoning.clear();
  }
}

export function
createExecutiveReasoningService() {
  return new ExecutiveReasoningService();
}
