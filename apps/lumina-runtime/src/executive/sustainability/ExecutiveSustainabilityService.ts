import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveSustainability,
  type CreateExecutiveSustainabilityInput,
  type ExecutiveSustainability,
  type ExecutiveSustainabilityStatus,
} from "./ExecutiveSustainability.js";

export class
ExecutiveSustainabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveSustainability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveSustainabilityInput,
  ): ExecutiveSustainability {

    const record =
      createExecutiveSustainability(
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
        "executive-sustainability",
      title:
        record.title,
      summary:
        `Sustainability score ${record.sustainabilityScore}`,
      payload: {
        sustainabilityId:
          record.id,
        sustainabilityScore:
          record.sustainabilityScore,
        operationalHealth:
          record.operationalHealth,
        maintainabilityScore:
          record.maintainabilityScore,
        longevityScore:
          record.longevityScore,
      },
    });

    return record;
  }

  updateStatus(
    sustainabilityId: string,
    status:
      ExecutiveSustainabilityStatus,
  ): ExecutiveSustainability {

    const existing =
      this.records.get(
        sustainabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive sustainability "${sustainabilityId}".`,
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
      sustainabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${sustainabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-sustainability",
      title:
        updated.title,
      summary:
        `Sustainability status changed to ${status}.`,
      payload: {
        sustainabilityId,
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
createExecutiveSustainabilityService() {
  return new ExecutiveSustainabilityService();
}
