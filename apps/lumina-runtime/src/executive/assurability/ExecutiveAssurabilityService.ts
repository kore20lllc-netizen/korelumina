import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAssurability,
  type CreateExecutiveAssurabilityInput,
  type ExecutiveAssurability,
  type ExecutiveAssurabilityStatus,
} from "./ExecutiveAssurability.js";

export class ExecutiveAssurabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveAssurability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAssurabilityInput,
  ): ExecutiveAssurability {

    const record =
      createExecutiveAssurability(
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
        "executive-assurability",
      title:
        record.title,
      summary:
        `Assurability score ${record.assurabilityScore}`,
      payload: {
        assurabilityId:
          record.id,
        assurabilityScore:
          record.assurabilityScore,
        confidenceScore:
          record.confidenceScore,
        evidenceCompleteness:
          record.evidenceCompleteness,
        assuranceReadiness:
          record.assuranceReadiness,
      },
    });

    return record;
  }

  updateStatus(
    assurabilityId: string,
    status:
      ExecutiveAssurabilityStatus,
  ): ExecutiveAssurability {

    const existing =
      this.records.get(
        assurabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive assurability "${assurabilityId}".`,
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
      assurabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${assurabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-assurability",
      title:
        updated.title,
      summary:
        `Assurability status changed to ${status}.`,
      payload: {
        assurabilityId,
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
createExecutiveAssurabilityService() {
  return new ExecutiveAssurabilityService();
}
