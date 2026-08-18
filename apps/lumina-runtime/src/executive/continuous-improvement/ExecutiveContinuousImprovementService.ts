import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveContinuousImprovement,
  type CreateExecutiveContinuousImprovementInput,
  type ExecutiveContinuousImprovement,
  type ExecutiveContinuousImprovementStatus,
} from "./ExecutiveContinuousImprovement.js";

export class
ExecutiveContinuousImprovementService {

  private readonly records =
    new Map<
      string,
      ExecutiveContinuousImprovement
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveContinuousImprovementInput,
  ): ExecutiveContinuousImprovement {

    const record =
      createExecutiveContinuousImprovement(
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
        "executive-continuous-improvement",
      title:
        record.title,
      summary:
        `Continuous improvement score ${record.continuousImprovementScore}`,
      payload: {
        continuousImprovementId:
          record.id,
        continuousImprovementScore:
          record.continuousImprovementScore,
        improvementVelocity:
          record.improvementVelocity,
        innovationRate:
          record.innovationRate,
        learningEffectiveness:
          record.learningEffectiveness,
      },
    });

    return record;
  }

  updateStatus(
    continuousImprovementId: string,
    status:
      ExecutiveContinuousImprovementStatus,
  ): ExecutiveContinuousImprovement {

    const existing =
      this.records.get(
        continuousImprovementId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive continuous improvement "${continuousImprovementId}".`,
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
      continuousImprovementId,
      updated,
    );

    this.timeline.record({
      id:
        `${continuousImprovementId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-continuous-improvement",
      title:
        updated.title,
      summary:
        `Continuous improvement status changed to ${status}.`,
      payload: {
        continuousImprovementId,
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
createExecutiveContinuousImprovementService() {
  return new ExecutiveContinuousImprovementService();
}
