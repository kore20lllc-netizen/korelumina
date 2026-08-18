import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveDecidability,
  type CreateExecutiveDecidabilityInput,
  type ExecutiveDecidability,
  type ExecutiveDecidabilityStatus,
} from "./ExecutiveDecidability.js";

export class ExecutiveDecidabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveDecidability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveDecidabilityInput,
  ): ExecutiveDecidability {

    const record =
      createExecutiveDecidability(
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
        "executive-decidability",
      title:
        record.title,
      summary:
        `Decidability score ${record.decidabilityScore}`,
      payload: {
        decidabilityId:
          record.id,
        decidabilityScore:
          record.decidabilityScore,
        optionClarity:
          record.optionClarity,
        ambiguityReduction:
          record.ambiguityReduction,
        recommendationStrength:
          record.recommendationStrength,
      },
    });

    return record;
  }

  updateStatus(
    decidabilityId: string,
    status:
      ExecutiveDecidabilityStatus,
  ): ExecutiveDecidability {

    const existing =
      this.records.get(
        decidabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive decidability "${decidabilityId}".`,
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
      decidabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${decidabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-decidability",
      title:
        updated.title,
      summary:
        `Decidability status changed to ${status}.`,
      payload: {
        decidabilityId,
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
createExecutiveDecidabilityService() {
  return new ExecutiveDecidabilityService();
}
