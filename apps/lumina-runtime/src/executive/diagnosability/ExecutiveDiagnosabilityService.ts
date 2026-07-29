import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveDiagnosability,
  type CreateExecutiveDiagnosabilityInput,
  type ExecutiveDiagnosability,
  type ExecutiveDiagnosabilityStatus,
} from "./ExecutiveDiagnosability.js";

export class ExecutiveDiagnosabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveDiagnosability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveDiagnosabilityInput,
  ): ExecutiveDiagnosability {

    const record =
      createExecutiveDiagnosability(
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
        "executive-diagnosability",
      title:
        record.title,
      summary:
        `Diagnosability score ${record.diagnosabilityScore}`,
      payload: {
        diagnosabilityId:
          record.id,
        diagnosabilityScore:
          record.diagnosabilityScore,
        faultIsolationScore:
          record.faultIsolationScore,
        rootCauseCoverage:
          record.rootCauseCoverage,
        telemetryReadiness:
          record.telemetryReadiness,
      },
    });

    return record;
  }

  updateStatus(
    diagnosabilityId: string,
    status:
      ExecutiveDiagnosabilityStatus,
  ): ExecutiveDiagnosability {

    const existing =
      this.records.get(
        diagnosabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive diagnosability "${diagnosabilityId}".`,
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
      diagnosabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${diagnosabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-diagnosability",
      title:
        updated.title,
      summary:
        `Diagnosability status changed to ${status}.`,
      payload: {
        diagnosabilityId,
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
createExecutiveDiagnosabilityService() {
  return new ExecutiveDiagnosabilityService();
}
