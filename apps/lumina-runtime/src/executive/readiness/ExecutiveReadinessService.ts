import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveReadiness,
  type CreateExecutiveReadinessInput,
  type ExecutiveReadiness,
  type ExecutiveReadinessStatus,
} from "./ExecutiveReadiness.js";

export class ExecutiveReadinessService {

  private readonly records =
    new Map<
      string,
      ExecutiveReadiness
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveReadinessInput,
  ): ExecutiveReadiness {

    const record =
      createExecutiveReadiness(
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
        "executive-readiness",
      title:
        record.title,
      summary:
        `Readiness ${record.readinessScore}/${record.targetScore}`,
      payload: {
        readinessId:
          record.id,
        readinessScore:
          record.readinessScore,
        targetScore:
          record.targetScore,
      },
    });

    return record;
  }

  updateStatus(
    readinessId: string,
    status:
      ExecutiveReadinessStatus,
  ): ExecutiveReadiness {

    const existing =
      this.records.get(
        readinessId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive readiness "${readinessId}".`,
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
      readinessId,
      updated,
    );

    this.timeline.record({
      id:
        `${readinessId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-readiness",
      title:
        updated.title,
      summary:
        `Readiness status changed to ${status}.`,
      payload: {
        readinessId,
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
createExecutiveReadinessService() {
  return new ExecutiveReadinessService();
}
