import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveComposability,
  type CreateExecutiveComposabilityInput,
  type ExecutiveComposability,
  type ExecutiveComposabilityStatus,
} from "./ExecutiveComposability.js";

export class ExecutiveComposabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveComposability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveComposabilityInput,
  ): ExecutiveComposability {

    const record =
      createExecutiveComposability(
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
        "executive-composability",
      title:
        record.title,
      summary:
        `Composability score ${record.composabilityScore}`,
      payload: {
        composabilityId:
          record.id,
        composabilityScore:
          record.composabilityScore,
        reuseScore:
          record.reuseScore,
        orchestrationScore:
          record.orchestrationScore,
        compositionCoverage:
          record.compositionCoverage,
      },
    });

    return record;
  }

  updateStatus(
    composabilityId: string,
    status:
      ExecutiveComposabilityStatus,
  ): ExecutiveComposability {

    const existing =
      this.records.get(
        composabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive composability "${composabilityId}".`,
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
      composabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${composabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-composability",
      title:
        updated.title,
      summary:
        `Composability status changed to ${status}.`,
      payload: {
        composabilityId,
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
createExecutiveComposabilityService() {
  return new ExecutiveComposabilityService();
}
