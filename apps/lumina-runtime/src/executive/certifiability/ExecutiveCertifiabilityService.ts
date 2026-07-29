import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveCertifiability,
  type CreateExecutiveCertifiabilityInput,
  type ExecutiveCertifiability,
  type ExecutiveCertifiabilityStatus,
} from "./ExecutiveCertifiability.js";

export class ExecutiveCertifiabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveCertifiability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveCertifiabilityInput,
  ): ExecutiveCertifiability {

    const record =
      createExecutiveCertifiability(
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
        "executive-certifiability",
      title:
        record.title,
      summary:
        `Certifiability score ${record.certifiabilityScore}`,
      payload: {
        certifiabilityId:
          record.id,
        certifiabilityScore:
          record.certifiabilityScore,
        complianceReadiness:
          record.complianceReadiness,
        evidenceCoverage:
          record.evidenceCoverage,
        certificationReadiness:
          record.certificationReadiness,
      },
    });

    return record;
  }

  updateStatus(
    certifiabilityId: string,
    status:
      ExecutiveCertifiabilityStatus,
  ): ExecutiveCertifiability {

    const existing =
      this.records.get(
        certifiabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive certifiability "${certifiabilityId}".`,
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
      certifiabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${certifiabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-certifiability",
      title:
        updated.title,
      summary:
        `Certifiability status changed to ${status}.`,
      payload: {
        certifiabilityId,
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
createExecutiveCertifiabilityService() {
  return new ExecutiveCertifiabilityService();
}
