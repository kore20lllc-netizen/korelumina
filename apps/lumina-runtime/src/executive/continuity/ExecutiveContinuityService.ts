import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveContinuity,
  type CreateExecutiveContinuityInput,
  type ExecutiveContinuity,
  type ExecutiveContinuityStatus,
} from "./ExecutiveContinuity.js";

export class ExecutiveContinuityService {

  private readonly records =
    new Map<
      string,
      ExecutiveContinuity
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveContinuityInput,
  ): ExecutiveContinuity {

    const record =
      createExecutiveContinuity(
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
        "executive-continuity",
      title:
        record.title,
      summary:
        `Continuity readiness ${record.readinessScore}%`,
      payload: {
        continuityId:
          record.id,
        readinessScore:
          record.readinessScore,
        recoveryTimeObjective:
          record.recoveryTimeObjective,
        recoveryPointObjective:
          record.recoveryPointObjective,
      },
    });

    return record;
  }

  updateStatus(
    continuityId: string,
    status:
      ExecutiveContinuityStatus,
  ): ExecutiveContinuity {

    const existing =
      this.records.get(
        continuityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive continuity "${continuityId}".`,
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
      continuityId,
      updated,
    );

    this.timeline.record({
      id:
        `${continuityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-continuity",
      title:
        updated.title,
      summary:
        `Continuity status changed to ${status}.`,
      payload: {
        continuityId,
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
createExecutiveContinuityService() {
  return new ExecutiveContinuityService();
}
