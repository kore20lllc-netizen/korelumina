import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveReliability,
  type CreateExecutiveReliabilityInput,
  type ExecutiveReliability,
  type ExecutiveReliabilityStatus,
} from "./ExecutiveReliability.js";

export class ExecutiveReliabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveReliability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveReliabilityInput,
  ): ExecutiveReliability {

    const record =
      createExecutiveReliability(
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
        "executive-reliability",
      title:
        record.title,
      summary:
        `Reliability ${record.availability}% availability`,
      payload: {
        reliabilityId:
          record.id,
        availability:
          record.availability,
        consistency:
          record.consistency,
        serviceLevel:
          record.serviceLevel,
      },
    });

    return record;
  }

  updateStatus(
    reliabilityId: string,
    status:
      ExecutiveReliabilityStatus,
  ): ExecutiveReliability {

    const existing =
      this.records.get(
        reliabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive reliability "${reliabilityId}".`,
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
      reliabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${reliabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-reliability",
      title:
        updated.title,
      summary:
        `Reliability status changed to ${status}.`,
      payload: {
        reliabilityId,
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
createExecutiveReliabilityService() {
  return new ExecutiveReliabilityService();
}
