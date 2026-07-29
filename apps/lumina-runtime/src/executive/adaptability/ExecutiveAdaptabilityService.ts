import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAdaptability,
  type CreateExecutiveAdaptabilityInput,
  type ExecutiveAdaptability,
  type ExecutiveAdaptabilityStatus,
} from "./ExecutiveAdaptability.js";

export class ExecutiveAdaptabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveAdaptability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAdaptabilityInput,
  ): ExecutiveAdaptability {

    const record =
      createExecutiveAdaptability(
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
        "executive-adaptability",
      title:
        record.title,
      summary:
        `Adaptability score ${record.adaptabilityScore}`,
      payload: {
        adaptabilityId:
          record.id,
        adaptabilityScore:
          record.adaptabilityScore,
        responsivenessScore:
          record.responsivenessScore,
        flexibilityScore:
          record.flexibilityScore,
        resilienceScore:
          record.resilienceScore,
      },
    });

    return record;
  }

  updateStatus(
    adaptabilityId: string,
    status:
      ExecutiveAdaptabilityStatus,
  ): ExecutiveAdaptability {

    const existing =
      this.records.get(
        adaptabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive adaptability "${adaptabilityId}".`,
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
      adaptabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${adaptabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-adaptability",
      title:
        updated.title,
      summary:
        `Adaptability status changed to ${status}.`,
      payload: {
        adaptabilityId,
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
createExecutiveAdaptabilityService() {
  return new ExecutiveAdaptabilityService();
}
