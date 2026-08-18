import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveEvolution,
  type CreateExecutiveEvolutionInput,
  type ExecutiveEvolution,
  type ExecutiveEvolutionStatus,
} from "./ExecutiveEvolution.js";

export class ExecutiveEvolutionService {

  private readonly records =
    new Map<
      string,
      ExecutiveEvolution
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveEvolutionInput,
  ): ExecutiveEvolution {

    const record =
      createExecutiveEvolution(
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
        "executive-evolution",
      title:
        record.title,
      summary:
        `Evolution score ${record.evolutionScore}`,
      payload: {
        evolutionId:
          record.id,
        evolutionScore:
          record.evolutionScore,
        maturityGrowth:
          record.maturityGrowth,
        capabilityGrowth:
          record.capabilityGrowth,
        strategicAlignment:
          record.strategicAlignment,
      },
    });

    return record;
  }

  updateStatus(
    evolutionId: string,
    status:
      ExecutiveEvolutionStatus,
  ): ExecutiveEvolution {

    const existing =
      this.records.get(
        evolutionId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive evolution "${evolutionId}".`,
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
      evolutionId,
      updated,
    );

    this.timeline.record({
      id:
        `${evolutionId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-evolution",
      title:
        updated.title,
      summary:
        `Evolution status changed to ${status}.`,
      payload: {
        evolutionId,
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
createExecutiveEvolutionService() {
  return new ExecutiveEvolutionService();
}
