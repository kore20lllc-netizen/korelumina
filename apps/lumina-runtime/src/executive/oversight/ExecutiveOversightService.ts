import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveOversight,
  type CreateExecutiveOversightInput,
  type ExecutiveOversight,
  type ExecutiveOversightStatus,
} from "./ExecutiveOversight.js";

export class ExecutiveOversightService {

  private readonly oversight =
    new Map<
      string,
      ExecutiveOversight
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveOversightInput,
  ): ExecutiveOversight {

    const record =
      createExecutiveOversight(
        input,
      );

    this.oversight.set(
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
        "executive-oversight",
      title:
        record.title,
      summary:
        record.scope,
      payload: {
        oversightId:
          record.id,
      },
    });

    return record;
  }

  updateStatus(
    oversightId: string,
    status:
      ExecutiveOversightStatus,
  ): ExecutiveOversight {

    const existing =
      this.oversight.get(
        oversightId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive oversight "${oversightId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.oversight.set(
      oversightId,
      updated,
    );

    this.timeline.record({
      id:
        `${oversightId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-oversight",
      title:
        updated.title,
      summary:
        `Oversight status changed to ${status}.`,
      payload: {
        oversightId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.oversight.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.oversight.values(),
      ),
    );
  }

  clear(): void {
    this.oversight.clear();
  }
}

export function
createExecutiveOversightService() {
  return new ExecutiveOversightService();
}
