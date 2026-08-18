import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAccountability,
  type CreateExecutiveAccountabilityInput,
  type ExecutiveAccountability,
  type ExecutiveAccountabilityStatus,
} from "./ExecutiveAccountability.js";

export class ExecutiveAccountabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveAccountability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAccountabilityInput,
  ): ExecutiveAccountability {

    const record =
      createExecutiveAccountability(
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
        "executive-accountability",
      title:
        record.title,
      summary:
        `Accountability score ${record.accountabilityScore}`,
      payload: {
        accountabilityId:
          record.id,
        accountabilityScore:
          record.accountabilityScore,
        ownershipCoverage:
          record.ownershipCoverage,
        decisionTransparency:
          record.decisionTransparency,
        governanceAlignment:
          record.governanceAlignment,
      },
    });

    return record;
  }

  updateStatus(
    accountabilityId: string,
    status:
      ExecutiveAccountabilityStatus,
  ): ExecutiveAccountability {

    const existing =
      this.records.get(
        accountabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive accountability "${accountabilityId}".`,
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
      accountabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${accountabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-accountability",
      title:
        updated.title,
      summary:
        `Accountability status changed to ${status}.`,
      payload: {
        accountabilityId,
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
createExecutiveAccountabilityService() {
  return new ExecutiveAccountabilityService();
}
