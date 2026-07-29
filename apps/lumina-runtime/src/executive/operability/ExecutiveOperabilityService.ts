import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveOperability,
  type CreateExecutiveOperabilityInput,
  type ExecutiveOperability,
  type ExecutiveOperabilityStatus,
} from "./ExecutiveOperability.js";

export class ExecutiveOperabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveOperability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveOperabilityInput,
  ): ExecutiveOperability {

    const record =
      createExecutiveOperability(
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
        "executive-operability",
      title:
        record.title,
      summary:
        `Operability score ${record.operabilityScore}`,
      payload: {
        operabilityId:
          record.id,
        operabilityScore:
          record.operabilityScore,
        operationalReadiness:
          record.operationalReadiness,
        automationCoverage:
          record.automationCoverage,
        supportabilityScore:
          record.supportabilityScore,
      },
    });

    return record;
  }

  updateStatus(
    operabilityId: string,
    status:
      ExecutiveOperabilityStatus,
  ): ExecutiveOperability {

    const existing =
      this.records.get(
        operabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive operability "${operabilityId}".`,
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
      operabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${operabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-operability",
      title:
        updated.title,
      summary:
        `Operability status changed to ${status}.`,
      payload: {
        operabilityId,
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
createExecutiveOperabilityService() {
  return new ExecutiveOperabilityService();
}
