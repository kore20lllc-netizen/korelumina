import type {
  ExecutiveEvent,
} from "../events/index.js";
import type {
  ExecutiveExperienceGraph,
} from "./ExecutiveExperienceGraph.js";
import {
  createExecutiveObservation,
  type ExecutiveObservation,
} from "./ExecutiveObservation.js";
import type {
  ExecutiveMemoryIndex,
  ExecutiveMemoryQuery,
} from "./ExecutiveMemoryIndex.js";
import type {
  ExecutiveMemoryRecord,
} from "./ExecutiveMemoryRecord.js";
import type {
  ExecutiveMemoryStore,
} from "./ExecutiveMemoryStore.js";

export interface ExecutiveMemoryServiceDependencies {
  store:
    ExecutiveMemoryStore;

  index:
    ExecutiveMemoryIndex;

  experienceGraph:
    ExecutiveExperienceGraph;
}

export class ExecutiveMemoryService {
  constructor(
    private readonly dependencies:
      ExecutiveMemoryServiceDependencies,
  ) {}

  async recordEvent(
    event: ExecutiveEvent,
  ): Promise<ExecutiveObservation> {
    const observation =
      createExecutiveObservation(
        event,
      );

    await this.dependencies
      .store
      .saveObservation(
        observation,
      );

    this.dependencies
      .index
      .indexObservation(
        observation,
      );

    return observation;
  }

  async remember(
    record:
      ExecutiveMemoryRecord,
  ): Promise<void> {
    for (
      const observationId
      of record.sourceObservationIds
    ) {
      const observation =
        await this.dependencies
          .store
          .getObservation(
            observationId,
          );

      if (!observation) {
        throw new Error(
          `Executive observation "${observationId}" was not found.`,
        );
      }
    }

    await this.dependencies
      .store
      .saveMemoryRecord(
        record,
      );

    this.dependencies
      .index
      .indexMemoryRecord(
        record,
      );
  }

  async findObservations(
    query:
      ExecutiveMemoryQuery,
  ): Promise<
    readonly ExecutiveObservation[]
  > {
    const ids =
      this.dependencies
        .index
        .queryObservationIds(
          query,
        );

    const observations =
      await Promise.all(
        ids.map(
          (id) =>
            this.dependencies
              .store
              .getObservation(id),
        ),
      );

    return observations.filter(
      (
        observation,
      ): observation is ExecutiveObservation =>
        Boolean(observation),
    );
  }

  async findMemoryRecords(
    query:
      ExecutiveMemoryQuery,
  ): Promise<
    readonly ExecutiveMemoryRecord[]
  > {
    const ids =
      this.dependencies
        .index
        .queryMemoryRecordIds(
          query,
        );

    const records =
      await Promise.all(
        ids.map(
          (id) =>
            this.dependencies
              .store
              .getMemoryRecord(id),
        ),
      );

    return records.filter(
      (
        record,
      ): record is ExecutiveMemoryRecord =>
        Boolean(record),
    );
  }

  get experienceGraph():
    ExecutiveExperienceGraph {
    return (
      this.dependencies
        .experienceGraph
    );
  }
}
