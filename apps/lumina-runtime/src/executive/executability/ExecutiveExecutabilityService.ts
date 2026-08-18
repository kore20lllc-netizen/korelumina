import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveExecutability,
  type CreateExecutiveExecutabilityInput,
  type ExecutiveExecutability,
  type ExecutiveExecutabilityStatus,
} from "./ExecutiveExecutability.js";

export class ExecutiveExecutabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveExecutability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveExecutabilityInput,
  ): ExecutiveExecutability {

    const record =
      createExecutiveExecutability(
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
        "executive-executability",
      title:
        record.title,
      summary:
        `Executability score ${record.executabilityScore}`,
      payload: {
        executabilityId:
          record.id,
        executabilityScore:
          record.executabilityScore,
        implementationReadiness:
          record.implementationReadiness,
        dependencyReadiness:
          record.dependencyReadiness,
        executionConfidence:
          record.executionConfidence,
      },
    });

    return record;
  }

  updateStatus(
    executabilityId: string,
    status:
      ExecutiveExecutabilityStatus,
  ): ExecutiveExecutability {

    const existing =
      this.records.get(
        executabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive executability "${executabilityId}".`,
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
      executabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${executabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-executability",
      title:
        updated.title,
      summary:
        `Executability status changed to ${status}.`,
      payload: {
        executabilityId,
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
createExecutiveExecutabilityService() {
  return new ExecutiveExecutabilityService();
}
