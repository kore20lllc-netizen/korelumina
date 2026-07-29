import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveInteroperability,
  type CreateExecutiveInteroperabilityInput,
  type ExecutiveInteroperability,
  type ExecutiveInteroperabilityStatus,
} from "./ExecutiveInteroperability.js";

export class ExecutiveInteroperabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveInteroperability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveInteroperabilityInput,
  ): ExecutiveInteroperability {

    const record =
      createExecutiveInteroperability(
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
        "executive-interoperability",
      title:
        record.title,
      summary:
        `Interoperability score ${record.interoperabilityScore}`,
      payload: {
        interoperabilityId:
          record.id,
        interoperabilityScore:
          record.interoperabilityScore,
        compatibilityScore:
          record.compatibilityScore,
        integrationCoverage:
          record.integrationCoverage,
        standardsCompliance:
          record.standardsCompliance,
      },
    });

    return record;
  }

  updateStatus(
    interoperabilityId: string,
    status:
      ExecutiveInteroperabilityStatus,
  ): ExecutiveInteroperability {

    const existing =
      this.records.get(
        interoperabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive interoperability "${interoperabilityId}".`,
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
      interoperabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${interoperabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-interoperability",
      title:
        updated.title,
      summary:
        `Interoperability status changed to ${status}.`,
      payload: {
        interoperabilityId,
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
createExecutiveInteroperabilityService() {
  return new ExecutiveInteroperabilityService();
}
