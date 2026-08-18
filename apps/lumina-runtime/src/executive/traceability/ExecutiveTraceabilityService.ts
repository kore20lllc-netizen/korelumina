import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveTraceability,
  type CreateExecutiveTraceabilityInput,
  type ExecutiveTraceability,
  type ExecutiveTraceabilityStatus,
} from "./ExecutiveTraceability.js";

export class ExecutiveTraceabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveTraceability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveTraceabilityInput,
  ): ExecutiveTraceability {

    const record =
      createExecutiveTraceability(
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
        "executive-traceability",
      title:
        record.title,
      summary:
        `Traceability score ${record.traceabilityScore}`,
      payload: {
        traceabilityId:
          record.id,
        traceabilityScore:
          record.traceabilityScore,
        lineageCoverage:
          record.lineageCoverage,
        auditLinkageScore:
          record.auditLinkageScore,
        provenanceScore:
          record.provenanceScore,
      },
    });

    return record;
  }

  updateStatus(
    traceabilityId: string,
    status:
      ExecutiveTraceabilityStatus,
  ): ExecutiveTraceability {

    const existing =
      this.records.get(
        traceabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive traceability "${traceabilityId}".`,
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
      traceabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${traceabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-traceability",
      title:
        updated.title,
      summary:
        `Traceability status changed to ${status}.`,
      payload: {
        traceabilityId,
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
createExecutiveTraceabilityService() {
  return new ExecutiveTraceabilityService();
}
