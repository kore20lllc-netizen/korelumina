import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveControllability,
  type CreateExecutiveControllabilityInput,
  type ExecutiveControllability,
  type ExecutiveControllabilityStatus,
} from "./ExecutiveControllability.js";

export class ExecutiveControllabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveControllability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveControllabilityInput,
  ): ExecutiveControllability {

    const record =
      createExecutiveControllability(
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
        "executive-controllability",
      title:
        record.title,
      summary:
        `Controllability score ${record.controllabilityScore}`,
      payload: {
        controllabilityId:
          record.id,
        controllabilityScore:
          record.controllabilityScore,
        automationControlScore:
          record.automationControlScore,
        policyEnforcementScore:
          record.policyEnforcementScore,
        governanceControlScore:
          record.governanceControlScore,
      },
    });

    return record;
  }

  updateStatus(
    controllabilityId: string,
    status:
      ExecutiveControllabilityStatus,
  ): ExecutiveControllability {

    const existing =
      this.records.get(
        controllabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive controllability "${controllabilityId}".`,
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
      controllabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${controllabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-controllability",
      title:
        updated.title,
      summary:
        `Controllability status changed to ${status}.`,
      payload: {
        controllabilityId,
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
createExecutiveControllabilityService() {
  return new ExecutiveControllabilityService();
}
