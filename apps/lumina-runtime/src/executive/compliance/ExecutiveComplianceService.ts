import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveCompliance,
  type CreateExecutiveComplianceInput,
  type ExecutiveCompliance,
  type ExecutiveComplianceStatus,
} from "./ExecutiveCompliance.js";

export class ExecutiveComplianceService {

  private readonly records =
    new Map<
      string,
      ExecutiveCompliance
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveComplianceInput,
  ): ExecutiveCompliance {

    const record =
      createExecutiveCompliance(
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
        "executive-compliance",
      title:
        record.title,
      summary:
        record.requirement,
      payload: {
        complianceId:
          record.id,
      },
    });

    return record;
  }

  updateStatus(
    complianceId: string,
    status:
      ExecutiveComplianceStatus,
  ): ExecutiveCompliance {

    const existing =
      this.records.get(
        complianceId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive compliance "${complianceId}".`,
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
      complianceId,
      updated,
    );

    this.timeline.record({
      id:
        `${complianceId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-compliance",
      title:
        updated.title,
      summary:
        `Compliance status changed to ${status}.`,
      payload: {
        complianceId,
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
createExecutiveComplianceService() {
  return new ExecutiveComplianceService();
}
