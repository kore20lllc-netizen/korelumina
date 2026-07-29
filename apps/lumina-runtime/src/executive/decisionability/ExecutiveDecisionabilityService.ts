import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveDecisionability,
  type CreateExecutiveDecisionabilityInput,
  type ExecutiveDecisionability,
  type ExecutiveDecisionabilityStatus,
} from "./ExecutiveDecisionability.js";

export class ExecutiveDecisionabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveDecisionability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveDecisionabilityInput,
  ): ExecutiveDecisionability {

    const record =
      createExecutiveDecisionability(
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
        "executive-decisionability",
      title:
        record.title,
      summary:
        `Decisionability score ${record.decisionabilityScore}`,
      payload: {
        decisionabilityId:
          record.id,
        decisionabilityScore:
          record.decisionabilityScore,
        evidenceQuality:
          record.evidenceQuality,
        optionCoverage:
          record.optionCoverage,
        decisionConfidence:
          record.decisionConfidence,
      },
    });

    return record;
  }

  updateStatus(
    decisionabilityId: string,
    status:
      ExecutiveDecisionabilityStatus,
  ): ExecutiveDecisionability {

    const existing =
      this.records.get(
        decisionabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive decisionability "${decisionabilityId}".`,
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
      decisionabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${decisionabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-decisionability",
      title:
        updated.title,
      summary:
        `Decisionability status changed to ${status}.`,
      payload: {
        decisionabilityId,
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
createExecutiveDecisionabilityService() {
  return new ExecutiveDecisionabilityService();
}
