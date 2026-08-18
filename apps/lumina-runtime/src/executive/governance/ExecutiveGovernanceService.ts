import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveGovernance,
  type CreateExecutiveGovernanceInput,
  type ExecutiveGovernance,
  type ExecutiveGovernanceStatus,
} from "./ExecutiveGovernance.js";

export class ExecutiveGovernanceService {

  private readonly governance =
    new Map<
      string,
      ExecutiveGovernance
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveGovernanceInput,
  ): ExecutiveGovernance {

    const record =
      createExecutiveGovernance(
        input,
      );

    this.governance.set(
      record.id,
      record,
    );

    this.timeline.record({
      id:
        `${record.id}:created`,
      sessionId:
        "executive-governance",
      type:
        "runtime-event",
      actorId:
        record.ownerId,
      source:
        "executive-governance",
      title:
        record.title,
      summary:
        record.description,
      payload: {
        governanceId:
          record.id,
      },
    });

    return record;
  }

  updateStatus(
    governanceId: string,
    status:
      ExecutiveGovernanceStatus,
  ): ExecutiveGovernance {

    const existing =
      this.governance.get(
        governanceId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive governance "${governanceId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.governance.set(
      governanceId,
      updated,
    );

    this.timeline.record({
      id:
        `${governanceId}:${status}`,
      sessionId:
        "executive-governance",
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-governance",
      title:
        updated.title,
      summary:
        `Governance status changed to ${status}.`,
      payload: {
        governanceId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.governance.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.governance.values(),
      ),
    );
  }

  clear(): void {
    this.governance.clear();
  }
}

export function
createExecutiveGovernanceService() {
  return new ExecutiveGovernanceService();
}
