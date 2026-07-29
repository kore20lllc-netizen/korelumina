import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveTestability,
  type CreateExecutiveTestabilityInput,
  type ExecutiveTestability,
  type ExecutiveTestabilityStatus,
} from "./ExecutiveTestability.js";

export class ExecutiveTestabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveTestability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveTestabilityInput,
  ): ExecutiveTestability {

    const record =
      createExecutiveTestability(
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
        "executive-testability",
      title:
        record.title,
      summary:
        `Testability score ${record.testabilityScore}`,
      payload: {
        testabilityId:
          record.id,
        testabilityScore:
          record.testabilityScore,
        automationCoverage:
          record.automationCoverage,
        observabilityScore:
          record.observabilityScore,
        verificationReadiness:
          record.verificationReadiness,
      },
    });

    return record;
  }

  updateStatus(
    testabilityId: string,
    status:
      ExecutiveTestabilityStatus,
  ): ExecutiveTestability {

    const existing =
      this.records.get(
        testabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive testability "${testabilityId}".`,
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
      testabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${testabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-testability",
      title:
        updated.title,
      summary:
        `Testability status changed to ${status}.`,
      payload: {
        testabilityId,
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
createExecutiveTestabilityService() {
  return new ExecutiveTestabilityService();
}
