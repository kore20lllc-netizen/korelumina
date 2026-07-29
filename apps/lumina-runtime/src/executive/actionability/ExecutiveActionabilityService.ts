import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveActionability,
  type CreateExecutiveActionabilityInput,
  type ExecutiveActionability,
  type ExecutiveActionabilityStatus,
} from "./ExecutiveActionability.js";

export class ExecutiveActionabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveActionability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveActionabilityInput,
  ): ExecutiveActionability {

    const record =
      createExecutiveActionability(
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
        "executive-actionability",
      title:
        record.title,
      summary:
        `Actionability score ${record.actionabilityScore}`,
      payload: {
        actionabilityId:
          record.id,
        actionabilityScore:
          record.actionabilityScore,
        implementationReadiness:
          record.implementationReadiness,
        prioritizationScore:
          record.prioritizationScore,
        executionReadiness:
          record.executionReadiness,
      },
    });

    return record;
  }

  updateStatus(
    actionabilityId: string,
    status:
      ExecutiveActionabilityStatus,
  ): ExecutiveActionability {

    const existing =
      this.records.get(
        actionabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive actionability "${actionabilityId}".`,
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
      actionabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${actionabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-actionability",
      title:
        updated.title,
      summary:
        `Actionability status changed to ${status}.`,
      payload: {
        actionabilityId,
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
createExecutiveActionabilityService() {
  return new ExecutiveActionabilityService();
}
