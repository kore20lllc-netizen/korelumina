import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveTrustworthiness,
  type CreateExecutiveTrustworthinessInput,
  type ExecutiveTrustworthiness,
  type ExecutiveTrustworthinessStatus,
} from "./ExecutiveTrustworthiness.js";

export class ExecutiveTrustworthinessService {

  private readonly records =
    new Map<
      string,
      ExecutiveTrustworthiness
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveTrustworthinessInput,
  ): ExecutiveTrustworthiness {

    const record =
      createExecutiveTrustworthiness(
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
        "executive-trustworthiness",
      title:
        record.title,
      summary:
        `Trustworthiness score ${record.trustworthinessScore}`,
      payload: {
        trustworthinessId:
          record.id,
        trustworthinessScore:
          record.trustworthinessScore,
        integrityScore:
          record.integrityScore,
        credibilityScore:
          record.credibilityScore,
        consistencyScore:
          record.consistencyScore,
      },
    });

    return record;
  }

  updateStatus(
    trustworthinessId: string,
    status:
      ExecutiveTrustworthinessStatus,
  ): ExecutiveTrustworthiness {

    const existing =
      this.records.get(
        trustworthinessId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive trustworthiness "${trustworthinessId}".`,
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
      trustworthinessId,
      updated,
    );

    this.timeline.record({
      id:
        `${trustworthinessId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-trustworthiness",
      title:
        updated.title,
      summary:
        `Trustworthiness status changed to ${status}.`,
      payload: {
        trustworthinessId,
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
createExecutiveTrustworthinessService() {
  return new ExecutiveTrustworthinessService();
}
