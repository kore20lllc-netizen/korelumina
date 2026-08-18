import type {
  ExecutiveEventCategory,
} from "../events/index.js";
import type {
  ExecutiveMemoryRecord,
} from "./ExecutiveMemoryRecord.js";
import type {
  ExecutiveObservation,
} from "./ExecutiveObservation.js";

export interface ExecutiveMemoryQuery {
  projectId?: string;

  missionId?: string;

  workspace?: string;

  category?:
    ExecutiveEventCategory;

  actorId?: string;

  tag?: string;

  from?: number;

  to?: number;
}

export interface ExecutiveMemoryIndex {
  indexObservation(
    observation:
      ExecutiveObservation,
  ): void;

  indexMemoryRecord(
    record:
      ExecutiveMemoryRecord,
  ): void;

  queryObservationIds(
    query:
      ExecutiveMemoryQuery,
  ): readonly string[];

  queryMemoryRecordIds(
    query:
      ExecutiveMemoryQuery,
  ): readonly string[];
}

interface IndexedExecutiveEntity {
  id: string;

  projectId?: string;

  missionId?: string;

  workspace?: string;

  category:
    ExecutiveEventCategory;

  actorId?: string;

  tags:
    readonly string[];

  timestamp: number;
}

function matchesQuery(
  entity:
    IndexedExecutiveEntity,
  query:
    ExecutiveMemoryQuery,
): boolean {
  if (
    query.projectId &&
    entity.projectId !==
      query.projectId
  ) {
    return false;
  }

  if (
    query.missionId &&
    entity.missionId !==
      query.missionId
  ) {
    return false;
  }

  if (
    query.workspace &&
    entity.workspace !==
      query.workspace
  ) {
    return false;
  }

  if (
    query.category &&
    entity.category !==
      query.category
  ) {
    return false;
  }

  if (
    query.actorId &&
    entity.actorId !==
      query.actorId
  ) {
    return false;
  }

  if (
    query.tag &&
    !entity.tags.includes(
      query.tag,
    )
  ) {
    return false;
  }

  if (
    query.from !== undefined &&
    entity.timestamp <
      query.from
  ) {
    return false;
  }

  if (
    query.to !== undefined &&
    entity.timestamp >
      query.to
  ) {
    return false;
  }

  return true;
}

export class InMemoryExecutiveMemoryIndex
  implements ExecutiveMemoryIndex
{
  private readonly observations =
    new Map<
      string,
      IndexedExecutiveEntity
    >();

  private readonly memoryRecords =
    new Map<
      string,
      IndexedExecutiveEntity
    >();

  indexObservation(
    observation:
      ExecutiveObservation,
  ): void {
    this.observations.set(
      observation.id,
      {
        id:
          observation.id,

        projectId:
          observation.projectId,

        missionId:
          observation.missionId,

        workspace:
          observation.workspace,

        category:
          observation.category,

        actorId:
          observation.actor.id,

        tags: [],

        timestamp:
          observation.observedAt,
      },
    );
  }

  indexMemoryRecord(
    record:
      ExecutiveMemoryRecord,
  ): void {
    this.memoryRecords.set(
      record.id,
      {
        id:
          record.id,

        projectId:
          record.projectId,

        missionId:
          record.missionId,

        workspace:
          record.workspace,

        category:
          record.category,

        tags:
          record.tags,

        timestamp:
          record.createdAt,
      },
    );
  }

  queryObservationIds(
    query:
      ExecutiveMemoryQuery,
  ): readonly string[] {
    return Array.from(
      this.observations.values(),
    )
      .filter(
        (entity) =>
          matchesQuery(
            entity,
            query,
          ),
      )
      .sort(
        (left, right) =>
          right.timestamp -
          left.timestamp,
      )
      .map(
        (entity) =>
          entity.id,
      );
  }

  queryMemoryRecordIds(
    query:
      ExecutiveMemoryQuery,
  ): readonly string[] {
    return Array.from(
      this.memoryRecords.values(),
    )
      .filter(
        (entity) =>
          matchesQuery(
            entity,
            query,
          ),
      )
      .sort(
        (left, right) =>
          right.timestamp -
          left.timestamp,
      )
      .map(
        (entity) =>
          entity.id,
      );
  }
}
