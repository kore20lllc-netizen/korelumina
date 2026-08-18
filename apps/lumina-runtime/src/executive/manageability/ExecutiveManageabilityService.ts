import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveManageability,
  type CreateExecutiveManageabilityInput,
  type ExecutiveManageability,
  type ExecutiveManageabilityStatus,
} from "./ExecutiveManageability.js";

export class ExecutiveManageabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveManageability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveManageabilityInput,
  ): ExecutiveManageability {

    const record =
      createExecutiveManageability(
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
        "executive-manageability",
      title:
        record.title,
      summary:
        `Manageability score ${record.manageabilityScore}`,
      payload: {
        manageabilityId:
          record.id,
        manageabilityScore:
          record.manageabilityScore,
        administrationScore:
          record.administrationScore,
        governanceCoverage:
          record.governanceCoverage,
        operationalEfficiency:
          record.operationalEfficiency,
      },
    });

    return record;
  }

  updateStatus(
    manageabilityId: string,
    status:
      ExecutiveManageabilityStatus,
  ): ExecutiveManageability {

    const existing =
      this.records.get(
        manageabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive manageability "${manageabilityId}".`,
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
      manageabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${manageabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-manageability",
      title:
        updated.title,
      summary:
        `Manageability status changed to ${status}.`,
      payload: {
        manageabilityId,
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
createExecutiveManageabilityService() {
  return new ExecutiveManageabilityService();
}
