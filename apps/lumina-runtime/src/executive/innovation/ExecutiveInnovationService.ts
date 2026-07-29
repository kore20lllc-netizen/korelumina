import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveInnovation,
  type CreateExecutiveInnovationInput,
  type ExecutiveInnovation,
  type ExecutiveInnovationStatus,
} from "./ExecutiveInnovation.js";

export class ExecutiveInnovationService {

  private readonly records =
    new Map<
      string,
      ExecutiveInnovation
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveInnovationInput,
  ): ExecutiveInnovation {

    const record =
      createExecutiveInnovation(
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
        "executive-innovation",
      title:
        record.title,
      summary:
        `Innovation score ${record.innovationScore}`,
      payload: {
        innovationId:
          record.id,
        innovationScore:
          record.innovationScore,
        creativityScore:
          record.creativityScore,
        experimentationScore:
          record.experimentationScore,
        innovationImpact:
          record.innovationImpact,
      },
    });

    return record;
  }

  updateStatus(
    innovationId: string,
    status:
      ExecutiveInnovationStatus,
  ): ExecutiveInnovation {

    const existing =
      this.records.get(
        innovationId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive innovation "${innovationId}".`,
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
      innovationId,
      updated,
    );

    this.timeline.record({
      id:
        `${innovationId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-innovation",
      title:
        updated.title,
      summary:
        `Innovation status changed to ${status}.`,
      payload: {
        innovationId,
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
createExecutiveInnovationService() {
  return new ExecutiveInnovationService();
}
