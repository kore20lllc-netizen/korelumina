import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveInspectability,
  type CreateExecutiveInspectabilityInput,
  type ExecutiveInspectability,
  type ExecutiveInspectabilityStatus,
} from "./ExecutiveInspectability.js";

export class ExecutiveInspectabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveInspectability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveInspectabilityInput,
  ): ExecutiveInspectability {

    const record =
      createExecutiveInspectability(
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
        "executive-inspectability",
      title:
        record.title,
      summary:
        `Inspectability score ${record.inspectabilityScore}`,
      payload: {
        inspectabilityId:
          record.id,
        inspectabilityScore:
          record.inspectabilityScore,
        transparencyScore:
          record.transparencyScore,
        diagnosticCoverage:
          record.diagnosticCoverage,
        introspectionReadiness:
          record.introspectionReadiness,
      },
    });

    return record;
  }

  updateStatus(
    inspectabilityId: string,
    status:
      ExecutiveInspectabilityStatus,
  ): ExecutiveInspectability {

    const existing =
      this.records.get(
        inspectabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive inspectability "${inspectabilityId}".`,
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
      inspectabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${inspectabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-inspectability",
      title:
        updated.title,
      summary:
        `Inspectability status changed to ${status}.`,
      payload: {
        inspectabilityId,
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
createExecutiveInspectabilityService() {
  return new ExecutiveInspectabilityService();
}
