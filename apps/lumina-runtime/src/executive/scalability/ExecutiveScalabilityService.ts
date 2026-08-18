import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveScalability,
  type CreateExecutiveScalabilityInput,
  type ExecutiveScalability,
  type ExecutiveScalabilityStatus,
} from "./ExecutiveScalability.js";

export class ExecutiveScalabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveScalability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveScalabilityInput,
  ): ExecutiveScalability {

    const record =
      createExecutiveScalability(
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
        "executive-scalability",
      title:
        record.title,
      summary:
        `Scalability score ${record.scalabilityScore}`,
      payload: {
        scalabilityId:
          record.id,
        scalabilityScore:
          record.scalabilityScore,
        capacityScore:
          record.capacityScore,
        elasticityScore:
          record.elasticityScore,
        growthReadinessScore:
          record.growthReadinessScore,
      },
    });

    return record;
  }

  updateStatus(
    scalabilityId: string,
    status:
      ExecutiveScalabilityStatus,
  ): ExecutiveScalability {

    const existing =
      this.records.get(
        scalabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive scalability "${scalabilityId}".`,
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
      scalabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${scalabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-scalability",
      title:
        updated.title,
      summary:
        `Scalability status changed to ${status}.`,
      payload: {
        scalabilityId,
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
createExecutiveScalabilityService() {
  return new ExecutiveScalabilityService();
}
