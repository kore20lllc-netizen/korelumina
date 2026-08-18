import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveObservability,
  type CreateExecutiveObservabilityInput,
  type ExecutiveObservability,
  type ExecutiveObservabilityStatus,
} from "./ExecutiveObservability.js";

export class ExecutiveObservabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveObservability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveObservabilityInput,
  ): ExecutiveObservability {

    const record =
      createExecutiveObservability(
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
        "executive-observability",
      title:
        record.title,
      summary:
        `Observability score ${record.observabilityScore}`,
      payload: {
        observabilityId:
          record.id,
        observabilityScore:
          record.observabilityScore,
        visibilityScore:
          record.visibilityScore,
        telemetryCoverage:
          record.telemetryCoverage,
        traceabilityScore:
          record.traceabilityScore,
      },
    });

    return record;
  }

  updateStatus(
    observabilityId: string,
    status:
      ExecutiveObservabilityStatus,
  ): ExecutiveObservability {

    const existing =
      this.records.get(
        observabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive observability "${observabilityId}".`,
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
      observabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${observabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-observability",
      title:
        updated.title,
      summary:
        `Observability status changed to ${status}.`,
      payload: {
        observabilityId,
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
createExecutiveObservabilityService() {
  return new ExecutiveObservabilityService();
}
