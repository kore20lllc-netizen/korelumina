import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAvailability,
  type CreateExecutiveAvailabilityInput,
  type ExecutiveAvailability,
  type ExecutiveAvailabilityStatus,
} from "./ExecutiveAvailability.js";

export class ExecutiveAvailabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveAvailability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAvailabilityInput,
  ): ExecutiveAvailability {

    const record =
      createExecutiveAvailability(
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
        "executive-availability",
      title:
        record.title,
      summary:
        `Availability ${record.availability}%`,
      payload: {
        availabilityId:
          record.id,
        availability:
          record.availability,
        targetAvailability:
          record.targetAvailability,
        uptimeMinutes:
          record.uptimeMinutes,
        downtimeMinutes:
          record.downtimeMinutes,
      },
    });

    return record;
  }

  updateStatus(
    availabilityId: string,
    status:
      ExecutiveAvailabilityStatus,
  ): ExecutiveAvailability {

    const existing =
      this.records.get(
        availabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive availability "${availabilityId}".`,
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
      availabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${availabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-availability",
      title:
        updated.title,
      summary:
        `Availability status changed to ${status}.`,
      payload: {
        availabilityId,
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
createExecutiveAvailabilityService() {
  return new ExecutiveAvailabilityService();
}
