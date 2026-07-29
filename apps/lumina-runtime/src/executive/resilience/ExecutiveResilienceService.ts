import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveResilience,
  type CreateExecutiveResilienceInput,
  type ExecutiveResilience,
  type ExecutiveResilienceStatus,
} from "./ExecutiveResilience.js";

export class
ExecutiveResilienceService {

  private readonly records =
    new Map<
      string,
      ExecutiveResilience
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveResilienceInput,
  ): ExecutiveResilience {

    const record =
      createExecutiveResilience(
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
        "executive-resilience",
      title:
        record.title,
      summary:
        `Resilience score ${record.resilienceScore}`,
      payload: {
        resilienceId:
          record.id,
        resilienceScore:
          record.resilienceScore,
        recoveryCapability:
          record.recoveryCapability,
        continuityScore:
          record.continuityScore,
        adaptabilityScore:
          record.adaptabilityScore,
      },
    });

    return record;
  }

  updateStatus(
    resilienceId: string,
    status:
      ExecutiveResilienceStatus,
  ): ExecutiveResilience {

    const existing =
      this.records.get(
        resilienceId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive resilience "${resilienceId}".`,
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
      resilienceId,
      updated,
    );

    this.timeline.record({
      id:
        `${resilienceId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-resilience",
      title:
        updated.title,
      summary:
        `Resilience status changed to ${status}.`,
      payload: {
        resilienceId,
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
createExecutiveResilienceService() {
  return new ExecutiveResilienceService();
}
