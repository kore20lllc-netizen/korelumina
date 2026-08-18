import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveMonitorability,
  type CreateExecutiveMonitorabilityInput,
  type ExecutiveMonitorability,
  type ExecutiveMonitorabilityStatus,
} from "./ExecutiveMonitorability.js";

export class ExecutiveMonitorabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveMonitorability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveMonitorabilityInput,
  ): ExecutiveMonitorability {

    const record =
      createExecutiveMonitorability(
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
        "executive-monitorability",
      title:
        record.title,
      summary:
        `Monitorability score ${record.monitorabilityScore}`,
      payload: {
        monitorabilityId:
          record.id,
        monitorabilityScore:
          record.monitorabilityScore,
        observabilityCoverage:
          record.observabilityCoverage,
        alertingReadiness:
          record.alertingReadiness,
        telemetryCompleteness:
          record.telemetryCompleteness,
      },
    });

    return record;
  }

  updateStatus(
    monitorabilityId: string,
    status:
      ExecutiveMonitorabilityStatus,
  ): ExecutiveMonitorability {

    const existing =
      this.records.get(
        monitorabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive monitorability "${monitorabilityId}".`,
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
      monitorabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${monitorabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-monitorability",
      title:
        updated.title,
      summary:
        `Monitorability status changed to ${status}.`,
      payload: {
        monitorabilityId,
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
createExecutiveMonitorabilityService() {
  return new ExecutiveMonitorabilityService();
}
