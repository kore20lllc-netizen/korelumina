import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveEfficiency,
  type CreateExecutiveEfficiencyInput,
  type ExecutiveEfficiency,
  type ExecutiveEfficiencyStatus,
} from "./ExecutiveEfficiency.js";

export class ExecutiveEfficiencyService {

  private readonly records =
    new Map<
      string,
      ExecutiveEfficiency
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveEfficiencyInput,
  ): ExecutiveEfficiency {

    const record =
      createExecutiveEfficiency(
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
        "executive-efficiency",
      title:
        record.title,
      summary:
        `Efficiency score ${record.efficiencyScore}`,
      payload: {
        efficiencyId:
          record.id,
        efficiencyScore:
          record.efficiencyScore,
        resourceEfficiency:
          record.resourceEfficiency,
        timeEfficiency:
          record.timeEfficiency,
        costEfficiency:
          record.costEfficiency,
      },
    });

    return record;
  }

  updateStatus(
    efficiencyId: string,
    status:
      ExecutiveEfficiencyStatus,
  ): ExecutiveEfficiency {

    const existing =
      this.records.get(
        efficiencyId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive efficiency "${efficiencyId}".`,
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
      efficiencyId,
      updated,
    );

    this.timeline.record({
      id:
        `${efficiencyId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-efficiency",
      title:
        updated.title,
      summary:
        `Efficiency status changed to ${status}.`,
      payload: {
        efficiencyId,
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
createExecutiveEfficiencyService() {
  return new ExecutiveEfficiencyService();
}
