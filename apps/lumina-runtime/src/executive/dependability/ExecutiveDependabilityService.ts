import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveDependability,
  type CreateExecutiveDependabilityInput,
  type ExecutiveDependability,
  type ExecutiveDependabilityStatus,
} from "./ExecutiveDependability.js";

export class ExecutiveDependabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveDependability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveDependabilityInput,
  ): ExecutiveDependability {

    const record =
      createExecutiveDependability(
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
        "executive-dependability",
      title:
        record.title,
      summary:
        `Dependability score ${record.dependabilityScore}`,
      payload: {
        dependabilityId:
          record.id,
        dependabilityScore:
          record.dependabilityScore,
        trustScore:
          record.trustScore,
        faultTolerance:
          record.faultTolerance,
        consistency:
          record.consistency,
      },
    });

    return record;
  }

  updateStatus(
    dependabilityId: string,
    status:
      ExecutiveDependabilityStatus,
  ): ExecutiveDependability {

    const existing =
      this.records.get(
        dependabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive dependability "${dependabilityId}".`,
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
      dependabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${dependabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-dependability",
      title:
        updated.title,
      summary:
        `Dependability status changed to ${status}.`,
      payload: {
        dependabilityId,
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
createExecutiveDependabilityService() {
  return new ExecutiveDependabilityService();
}
