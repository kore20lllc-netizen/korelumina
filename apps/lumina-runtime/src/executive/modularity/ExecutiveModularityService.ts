import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveModularity,
  type CreateExecutiveModularityInput,
  type ExecutiveModularity,
  type ExecutiveModularityStatus,
} from "./ExecutiveModularity.js";

export class ExecutiveModularityService {

  private readonly records =
    new Map<
      string,
      ExecutiveModularity
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveModularityInput,
  ): ExecutiveModularity {

    const record =
      createExecutiveModularity(
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
        "executive-modularity",
      title:
        record.title,
      summary:
        `Modularity score ${record.modularityScore}`,
      payload: {
        modularityId:
          record.id,
        modularityScore:
          record.modularityScore,
        cohesionScore:
          record.cohesionScore,
        couplingScore:
          record.couplingScore,
        boundaryIntegrity:
          record.boundaryIntegrity,
      },
    });

    return record;
  }

  updateStatus(
    modularityId: string,
    status:
      ExecutiveModularityStatus,
  ): ExecutiveModularity {

    const existing =
      this.records.get(
        modularityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive modularity "${modularityId}".`,
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
      modularityId,
      updated,
    );

    this.timeline.record({
      id:
        `${modularityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-modularity",
      title:
        updated.title,
      summary:
        `Modularity status changed to ${status}.`,
      payload: {
        modularityId,
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
createExecutiveModularityService() {
  return new ExecutiveModularityService();
}
