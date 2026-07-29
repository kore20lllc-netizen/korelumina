import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveLearning,
  type CreateExecutiveLearningInput,
  type ExecutiveLearning,
  type ExecutiveLearningStatus,
} from "./ExecutiveLearning.js";

export class ExecutiveLearningService {

  private readonly records =
    new Map<
      string,
      ExecutiveLearning
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveLearningInput,
  ): ExecutiveLearning {

    const record =
      createExecutiveLearning(
        input,
      );

    this.records.set(
      record.id,
      record,
    );

    this.timeline.record({
      id:
        `${record.id}:created`,
      sessionId:
        record.sessionId,
      type:
        "runtime-event",
      actorId:
        record.ownerId,
      source:
        "executive-learning",
      title:
        record.title,
      summary:
        `Learning score ${record.learningScore}`,
      payload: {
        learningId:
          record.id,
        learningScore:
          record.learningScore,
        knowledgeGrowth:
          record.knowledgeGrowth,
        capabilityGrowth:
          record.capabilityGrowth,
        retentionScore:
          record.retentionScore,
      },
    });

    return record;
  }

  updateStatus(
    learningId: string,
    status:
      ExecutiveLearningStatus,
  ): ExecutiveLearning {

    const existing =
      this.records.get(
        learningId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive learning "${learningId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.records.set(
      learningId,
      updated,
    );

    this.timeline.record({
      id:
        `${learningId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-learning",
      title:
        updated.title,
      summary:
        `Learning status changed to ${status}.`,
      payload: {
        learningId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.records.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.records.values(),
      ),
    );
  }

  clear(): void {
    this.records.clear();
  }
}

export function
createExecutiveLearningService() {
  return new ExecutiveLearningService();
}
