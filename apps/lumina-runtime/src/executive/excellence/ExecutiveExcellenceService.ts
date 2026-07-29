import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveExcellence,
  type CreateExecutiveExcellenceInput,
  type ExecutiveExcellence,
  type ExecutiveExcellenceStatus,
} from "./ExecutiveExcellence.js";

export class ExecutiveExcellenceService {

  private readonly records =
    new Map<
      string,
      ExecutiveExcellence
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveExcellenceInput,
  ): ExecutiveExcellence {

    const record =
      createExecutiveExcellence(
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
        "executive-excellence",
      title:
        record.title,
      summary:
        `Excellence score ${record.excellenceScore}`,
      payload: {
        excellenceId:
          record.id,
        excellenceScore:
          record.excellenceScore,
        qualityScore:
          record.qualityScore,
        consistencyScore:
          record.consistencyScore,
        innovationScore:
          record.innovationScore,
      },
    });

    return record;
  }

  updateStatus(
    excellenceId: string,
    status:
      ExecutiveExcellenceStatus,
  ): ExecutiveExcellence {

    const existing =
      this.records.get(
        excellenceId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive excellence "${excellenceId}".`,
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
      excellenceId,
      updated,
    );

    this.timeline.record({
      id:
        `${excellenceId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-excellence",
      title:
        updated.title,
      summary:
        `Excellence status changed to ${status}.`,
      payload: {
        excellenceId,
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
createExecutiveExcellenceService() {
  return new ExecutiveExcellenceService();
}
