import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveOutcome,
  type CreateExecutiveOutcomeInput,
  type ExecutiveOutcome,
  type ExecutiveOutcomeStatus,
} from "./ExecutiveOutcome.js";

export class ExecutiveOutcomeService {

  private readonly outcomes =
    new Map<
      string,
      ExecutiveOutcome
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveOutcomeInput,
  ): ExecutiveOutcome {

    const outcome =
      createExecutiveOutcome(
        input,
      );

    this.outcomes.set(
      outcome.id,
      outcome,
    );

    this.timeline.record({
      id:
        `${outcome.id}:created`,
      sessionId:
        outcome.sessionId,
      type:
        "runtime-event",
      actorId:
        outcome.ownerId,
      source:
        "executive-outcome",
      title:
        outcome.title,
      summary:
        outcome.description,
      payload: {
        outcomeId:
          outcome.id,
        successScore:
          outcome.successScore,
      },
    });

    return outcome;
  }

  updateStatus(
    outcomeId: string,
    status:
      ExecutiveOutcomeStatus,
  ): ExecutiveOutcome {

    const existing =
      this.outcomes.get(
        outcomeId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive outcome "${outcomeId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.outcomes.set(
      outcomeId,
      updated,
    );

    this.timeline.record({
      id:
        `${outcomeId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-outcome",
      title:
        updated.title,
      summary:
        `Outcome status changed to ${status}.`,
      payload: {
        outcomeId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.outcomes.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.outcomes.values(),
      ),
    );
  }

  clear(): void {
    this.outcomes.clear();
  }
}

export function
createExecutiveOutcomeService() {
  return new ExecutiveOutcomeService();
}
