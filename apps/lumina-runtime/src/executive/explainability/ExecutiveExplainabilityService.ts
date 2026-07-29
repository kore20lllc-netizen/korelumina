import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveExplainability,
  type CreateExecutiveExplainabilityInput,
  type ExecutiveExplainability,
  type ExecutiveExplainabilityStatus,
} from "./ExecutiveExplainability.js";

export class ExecutiveExplainabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveExplainability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveExplainabilityInput,
  ): ExecutiveExplainability {

    const record =
      createExecutiveExplainability(
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
        "executive-explainability",
      title:
        record.title,
      summary:
        `Explainability score ${record.explainabilityScore}`,
      payload: {
        explainabilityId:
          record.id,
        explainabilityScore:
          record.explainabilityScore,
        transparencyScore:
          record.transparencyScore,
        interpretabilityScore:
          record.interpretabilityScore,
        documentationCoverage:
          record.documentationCoverage,
      },
    });

    return record;
  }

  updateStatus(
    explainabilityId: string,
    status:
      ExecutiveExplainabilityStatus,
  ): ExecutiveExplainability {

    const existing =
      this.records.get(
        explainabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive explainability "${explainabilityId}".`,
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
      explainabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${explainabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-explainability",
      title:
        updated.title,
      summary:
        `Explainability status changed to ${status}.`,
      payload: {
        explainabilityId,
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
createExecutiveExplainabilityService() {
  return new ExecutiveExplainabilityService();
}
