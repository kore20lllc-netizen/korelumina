import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveSupportability,
  type CreateExecutiveSupportabilityInput,
  type ExecutiveSupportability,
  type ExecutiveSupportabilityStatus,
} from "./ExecutiveSupportability.js";

export class ExecutiveSupportabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveSupportability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveSupportabilityInput,
  ): ExecutiveSupportability {

    const record =
      createExecutiveSupportability(
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
        "executive-supportability",
      title:
        record.title,
      summary:
        `Supportability score ${record.supportabilityScore}`,
      payload: {
        supportabilityId:
          record.id,
        supportabilityScore:
          record.supportabilityScore,
        serviceabilityScore:
          record.serviceabilityScore,
        maintenanceReadiness:
          record.maintenanceReadiness,
        incidentResponseReadiness:
          record.incidentResponseReadiness,
      },
    });

    return record;
  }

  updateStatus(
    supportabilityId: string,
    status:
      ExecutiveSupportabilityStatus,
  ): ExecutiveSupportability {

    const existing =
      this.records.get(
        supportabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive supportability "${supportabilityId}".`,
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
      supportabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${supportabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-supportability",
      title:
        updated.title,
      summary:
        `Supportability status changed to ${status}.`,
      payload: {
        supportabilityId,
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
createExecutiveSupportabilityService() {
  return new ExecutiveSupportabilityService();
}
