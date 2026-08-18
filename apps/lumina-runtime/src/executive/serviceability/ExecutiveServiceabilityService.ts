import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveServiceability,
  type CreateExecutiveServiceabilityInput,
  type ExecutiveServiceability,
  type ExecutiveServiceabilityStatus,
} from "./ExecutiveServiceability.js";

export class ExecutiveServiceabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveServiceability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveServiceabilityInput,
  ): ExecutiveServiceability {

    const record =
      createExecutiveServiceability(
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
        "executive-serviceability",
      title:
        record.title,
      summary:
        `Serviceability score ${record.serviceabilityScore}`,
      payload: {
        serviceabilityId:
          record.id,
        serviceabilityScore:
          record.serviceabilityScore,
        meanTimeToDetect:
          record.meanTimeToDetect,
        meanTimeToRepair:
          record.meanTimeToRepair,
        automationCoverage:
          record.automationCoverage,
      },
    });

    return record;
  }

  updateStatus(
    serviceabilityId: string,
    status:
      ExecutiveServiceabilityStatus,
  ): ExecutiveServiceability {

    const existing =
      this.records.get(
        serviceabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive serviceability "${serviceabilityId}".`,
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
      serviceabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${serviceabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-serviceability",
      title:
        updated.title,
      summary:
        `Serviceability status changed to ${status}.`,
      payload: {
        serviceabilityId,
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
createExecutiveServiceabilityService() {
  return new ExecutiveServiceabilityService();
}
