import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveReplaceability,
  type CreateExecutiveReplaceabilityInput,
  type ExecutiveReplaceability,
  type ExecutiveReplaceabilityStatus,
} from "./ExecutiveReplaceability.js";

export class ExecutiveReplaceabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveReplaceability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveReplaceabilityInput,
  ): ExecutiveReplaceability {

    const record =
      createExecutiveReplaceability(
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
        "executive-replaceability",
      title:
        record.title,
      summary:
        `Replaceability score ${record.replaceabilityScore}`,
      payload: {
        replaceabilityId:
          record.id,
        replaceabilityScore:
          record.replaceabilityScore,
        interchangeabilityScore:
          record.interchangeabilityScore,
        dependencyIsolation:
          record.dependencyIsolation,
        migrationSafety:
          record.migrationSafety,
      },
    });

    return record;
  }

  updateStatus(
    replaceabilityId: string,
    status:
      ExecutiveReplaceabilityStatus,
  ): ExecutiveReplaceability {

    const existing =
      this.records.get(
        replaceabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive replaceability "${replaceabilityId}".`,
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
      replaceabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${replaceabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-replaceability",
      title:
        updated.title,
      summary:
        `Replaceability status changed to ${status}.`,
      payload: {
        replaceabilityId,
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
createExecutiveReplaceabilityService() {
  return new ExecutiveReplaceabilityService();
}
