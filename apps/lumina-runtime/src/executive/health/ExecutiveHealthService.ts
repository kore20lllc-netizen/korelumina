import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveHealth,
  type CreateExecutiveHealthInput,
  type ExecutiveHealth,
  type ExecutiveHealthStatus,
} from "./ExecutiveHealth.js";

export class ExecutiveHealthService {

  private readonly records =
    new Map<
      string,
      ExecutiveHealth
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveHealthInput,
  ): ExecutiveHealth {

    const record =
      createExecutiveHealth(
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
        "executive-health",
      title:
        record.title,
      summary:
        `Health score ${record.healthScore}`,
      payload: {
        healthId:
          record.id,
        healthScore:
          record.healthScore,
        availability:
          record.availability,
        stability:
          record.stability,
      },
    });

    return record;
  }

  updateStatus(
    healthId: string,
    status:
      ExecutiveHealthStatus,
  ): ExecutiveHealth {

    const existing =
      this.records.get(
        healthId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive health "${healthId}".`,
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
      healthId,
      updated,
    );

    this.timeline.record({
      id:
        `${healthId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-health",
      title:
        updated.title,
      summary:
        `Health status changed to ${status}.`,
      payload: {
        healthId,
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
createExecutiveHealthService() {
  return new ExecutiveHealthService();
}
