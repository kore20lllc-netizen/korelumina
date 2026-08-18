import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveGovernability,
  type CreateExecutiveGovernabilityInput,
  type ExecutiveGovernability,
  type ExecutiveGovernabilityStatus,
} from "./ExecutiveGovernability.js";

export class ExecutiveGovernabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveGovernability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveGovernabilityInput,
  ): ExecutiveGovernability {

    const record =
      createExecutiveGovernability(
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
        "executive-governability",
      title:
        record.title,
      summary:
        `Governability score ${record.governabilityScore}`,
      payload: {
        governabilityId:
          record.id,
        governabilityScore:
          record.governabilityScore,
        policyCoverage:
          record.policyCoverage,
        governanceAutomation:
          record.governanceAutomation,
        oversightReadiness:
          record.oversightReadiness,
      },
    });

    return record;
  }

  updateStatus(
    governabilityId: string,
    status:
      ExecutiveGovernabilityStatus,
  ): ExecutiveGovernability {

    const existing =
      this.records.get(
        governabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive governability "${governabilityId}".`,
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
      governabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${governabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-governability",
      title:
        updated.title,
      summary:
        `Governability status changed to ${status}.`,
      payload: {
        governabilityId,
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
createExecutiveGovernabilityService() {
  return new ExecutiveGovernabilityService();
}
