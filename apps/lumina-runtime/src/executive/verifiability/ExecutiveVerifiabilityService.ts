import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveVerifiability,
  type CreateExecutiveVerifiabilityInput,
  type ExecutiveVerifiability,
  type ExecutiveVerifiabilityStatus,
} from "./ExecutiveVerifiability.js";

export class ExecutiveVerifiabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveVerifiability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveVerifiabilityInput,
  ): ExecutiveVerifiability {

    const record =
      createExecutiveVerifiability(
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
        "executive-verifiability",
      title:
        record.title,
      summary:
        `Verifiability score ${record.verifiabilityScore}`,
      payload: {
        verifiabilityId:
          record.id,
        verifiabilityScore:
          record.verifiabilityScore,
        evidenceCoverage:
          record.evidenceCoverage,
        traceabilityScore:
          record.traceabilityScore,
        validationReadiness:
          record.validationReadiness,
      },
    });

    return record;
  }

  updateStatus(
    verifiabilityId: string,
    status:
      ExecutiveVerifiabilityStatus,
  ): ExecutiveVerifiability {

    const existing =
      this.records.get(
        verifiabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive verifiability "${verifiabilityId}".`,
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
      verifiabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${verifiabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-verifiability",
      title:
        updated.title,
      summary:
        `Verifiability status changed to ${status}.`,
      payload: {
        verifiabilityId,
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
createExecutiveVerifiabilityService() {
  return new ExecutiveVerifiabilityService();
}
