import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveEvolvability,
  type CreateExecutiveEvolvabilityInput,
  type ExecutiveEvolvability,
  type ExecutiveEvolvabilityStatus,
} from "./ExecutiveEvolvability.js";

export class ExecutiveEvolvabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveEvolvability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveEvolvabilityInput,
  ): ExecutiveEvolvability {

    const record =
      createExecutiveEvolvability(
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
        "executive-evolvability",
      title:
        record.title,
      summary:
        `Evolvability score ${record.evolvabilityScore}`,
      payload: {
        evolvabilityId:
          record.id,
        evolvabilityScore:
          record.evolvabilityScore,
        adaptabilityScore:
          record.adaptabilityScore,
        innovationCapacity:
          record.innovationCapacity,
        architectureFlexibility:
          record.architectureFlexibility,
      },
    });

    return record;
  }

  updateStatus(
    evolvabilityId: string,
    status:
      ExecutiveEvolvabilityStatus,
  ): ExecutiveEvolvability {

    const existing =
      this.records.get(
        evolvabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive evolvability "${evolvabilityId}".`,
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
      evolvabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${evolvabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-evolvability",
      title:
        updated.title,
      summary:
        `Evolvability status changed to ${status}.`,
      payload: {
        evolvabilityId,
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
createExecutiveEvolvabilityService() {
  return new ExecutiveEvolvabilityService();
}
