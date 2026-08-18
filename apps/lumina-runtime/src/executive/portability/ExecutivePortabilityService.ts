import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutivePortability,
  type CreateExecutivePortabilityInput,
  type ExecutivePortability,
  type ExecutivePortabilityStatus,
} from "./ExecutivePortability.js";

export class ExecutivePortabilityService {

  private readonly records =
    new Map<
      string,
      ExecutivePortability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutivePortabilityInput,
  ): ExecutivePortability {

    const record =
      createExecutivePortability(
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
        "executive-portability",
      title:
        record.title,
      summary:
        `Portability score ${record.portabilityScore}`,
      payload: {
        portabilityId:
          record.id,
        portabilityScore:
          record.portabilityScore,
        platformCoverage:
          record.platformCoverage,
        migrationReadiness:
          record.migrationReadiness,
        deploymentFlexibility:
          record.deploymentFlexibility,
      },
    });

    return record;
  }

  updateStatus(
    portabilityId: string,
    status:
      ExecutivePortabilityStatus,
  ): ExecutivePortability {

    const existing =
      this.records.get(
        portabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive portability "${portabilityId}".`,
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
      portabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${portabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-portability",
      title:
        updated.title,
      summary:
        `Portability status changed to ${status}.`,
      payload: {
        portabilityId,
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
createExecutivePortabilityService() {
  return new ExecutivePortabilityService();
}
