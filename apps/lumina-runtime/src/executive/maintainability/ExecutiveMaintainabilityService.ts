import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveMaintainability,
  type CreateExecutiveMaintainabilityInput,
  type ExecutiveMaintainability,
  type ExecutiveMaintainabilityStatus,
} from "./ExecutiveMaintainability.js";

export class ExecutiveMaintainabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveMaintainability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveMaintainabilityInput,
  ): ExecutiveMaintainability {

    const record =
      createExecutiveMaintainability(
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
        "executive-maintainability",
      title:
        record.title,
      summary:
        `Maintainability score ${record.maintainabilityScore}`,
      payload: {
        maintainabilityId:
          record.id,
        maintainabilityScore:
          record.maintainabilityScore,
        technicalDebtScore:
          record.technicalDebtScore,
        documentationCoverage:
          record.documentationCoverage,
        codeHealth:
          record.codeHealth,
      },
    });

    return record;
  }

  updateStatus(
    maintainabilityId: string,
    status:
      ExecutiveMaintainabilityStatus,
  ): ExecutiveMaintainability {

    const existing =
      this.records.get(
        maintainabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive maintainability "${maintainabilityId}".`,
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
      maintainabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${maintainabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-maintainability",
      title:
        updated.title,
      summary:
        `Maintainability status changed to ${status}.`,
      payload: {
        maintainabilityId,
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
createExecutiveMaintainabilityService() {
  return new ExecutiveMaintainabilityService();
}
