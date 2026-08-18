import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveEffectiveness,
  type CreateExecutiveEffectivenessInput,
  type ExecutiveEffectiveness,
  type ExecutiveEffectivenessStatus,
} from "./ExecutiveEffectiveness.js";

export class ExecutiveEffectivenessService {

  private readonly records =
    new Map<
      string,
      ExecutiveEffectiveness
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveEffectivenessInput,
  ): ExecutiveEffectiveness {

    const record =
      createExecutiveEffectiveness(
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
        "executive-effectiveness",
      title:
        record.title,
      summary:
        `Effectiveness score ${record.effectivenessScore}`,
      payload: {
        effectivenessId:
          record.id,
        effectivenessScore:
          record.effectivenessScore,
        outcomeAchievement:
          record.outcomeAchievement,
        executionEfficiency:
          record.executionEfficiency,
        valueRealization:
          record.valueRealization,
      },
    });

    return record;
  }

  updateStatus(
    effectivenessId: string,
    status:
      ExecutiveEffectivenessStatus,
  ): ExecutiveEffectiveness {

    const existing =
      this.records.get(
        effectivenessId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive effectiveness "${effectivenessId}".`,
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
      effectivenessId,
      updated,
    );

    this.timeline.record({
      id:
        `${effectivenessId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-effectiveness",
      title:
        updated.title,
      summary:
        `Effectiveness status changed to ${status}.`,
      payload: {
        effectivenessId,
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
createExecutiveEffectivenessService() {
  return new ExecutiveEffectivenessService();
}
