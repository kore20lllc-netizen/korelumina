import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAdminability,
  type CreateExecutiveAdminabilityInput,
  type ExecutiveAdminability,
  type ExecutiveAdminabilityStatus,
} from "./ExecutiveAdminability.js";

export class ExecutiveAdminabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveAdminability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAdminabilityInput,
  ): ExecutiveAdminability {

    const record =
      createExecutiveAdminability(
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
        "executive-adminability",
      title:
        record.title,
      summary:
        `Adminability score ${record.adminabilityScore}`,
      payload: {
        adminabilityId:
          record.id,
        adminabilityScore:
          record.adminabilityScore,
        administrativeCoverage:
          record.administrativeCoverage,
        policyAutomation:
          record.policyAutomation,
        governanceReadiness:
          record.governanceReadiness,
      },
    });

    return record;
  }

  updateStatus(
    adminabilityId: string,
    status:
      ExecutiveAdminabilityStatus,
  ): ExecutiveAdminability {

    const existing =
      this.records.get(
        adminabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive adminability "${adminabilityId}".`,
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
      adminabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${adminabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-adminability",
      title:
        updated.title,
      summary:
        `Adminability status changed to ${status}.`,
      payload: {
        adminabilityId,
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
createExecutiveAdminabilityService() {
  return new ExecutiveAdminabilityService();
}
