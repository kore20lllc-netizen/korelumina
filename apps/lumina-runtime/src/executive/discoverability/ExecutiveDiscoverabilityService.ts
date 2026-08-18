import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveDiscoverability,
  type CreateExecutiveDiscoverabilityInput,
  type ExecutiveDiscoverability,
  type ExecutiveDiscoverabilityStatus,
} from "./ExecutiveDiscoverability.js";

export class ExecutiveDiscoverabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveDiscoverability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveDiscoverabilityInput,
  ): ExecutiveDiscoverability {

    const record =
      createExecutiveDiscoverability(
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
        "executive-discoverability",
      title:
        record.title,
      summary:
        `Discoverability score ${record.discoverabilityScore}`,
      payload: {
        discoverabilityId:
          record.id,
        discoverabilityScore:
          record.discoverabilityScore,
        searchCoverage:
          record.searchCoverage,
        catalogCompleteness:
          record.catalogCompleteness,
        metadataQuality:
          record.metadataQuality,
      },
    });

    return record;
  }

  updateStatus(
    discoverabilityId: string,
    status:
      ExecutiveDiscoverabilityStatus,
  ): ExecutiveDiscoverability {

    const existing =
      this.records.get(
        discoverabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive discoverability "${discoverabilityId}".`,
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
      discoverabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${discoverabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-discoverability",
      title:
        updated.title,
      summary:
        `Discoverability status changed to ${status}.`,
      payload: {
        discoverabilityId,
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
createExecutiveDiscoverabilityService() {
  return new ExecutiveDiscoverabilityService();
}
