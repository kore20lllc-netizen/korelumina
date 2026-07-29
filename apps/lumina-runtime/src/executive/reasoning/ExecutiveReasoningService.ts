import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

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
      this.reasoning.get(
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
  ) {
    return this.reasoning.get(
      id,
    );
  }

  list() {
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
