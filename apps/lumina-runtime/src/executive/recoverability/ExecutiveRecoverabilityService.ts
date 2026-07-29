import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveRecoverability,
  type CreateExecutiveRecoverabilityInput,
  type ExecutiveRecoverability,
  type ExecutiveRecoverabilityStatus,
} from "./ExecutiveRecoverability.js";

export class ExecutiveRecoverabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveRecoverability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveRecoverabilityInput,
  ): ExecutiveRecoverability {

    const record =
      createExecutiveRecoverability(
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
        "executive-recoverability",
      title:
        record.title,
      summary:
        `Recoverability score ${record.recoverabilityScore}`,
      payload: {
        recoverabilityId:
          record.id,
        recoverabilityScore:
          record.recoverabilityScore,
        recoveryTimeObjective:
          record.recoveryTimeObjective,
        recoveryPointObjective:
          record.recoveryPointObjective,
        recoverySuccessRate:
          record.recoverySuccessRate,
      },
    });

    return record;
  }

  updateStatus(
    recoverabilityId: string,
    status:
      ExecutiveRecoverabilityStatus,
  ): ExecutiveRecoverability {

    const existing =
      this.records.get(
        recoverabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive recoverability "${recoverabilityId}".`,
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
      recoverabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${recoverabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-recoverability",
      title:
        updated.title,
      summary:
        `Recoverability status changed to ${status}.`,
      payload: {
        recoverabilityId,
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
createExecutiveRecoverabilityService() {
  return new ExecutiveRecoverabilityService();
}
