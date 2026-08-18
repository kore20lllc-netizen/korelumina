import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveObjective,
  type CreateExecutiveObjectiveInput,
  type ExecutiveObjective,
  type ExecutiveObjectiveStatus,
} from "./ExecutiveObjective.js";

export class ExecutiveObjectiveService {

  private readonly objectives =
    new Map<
      string,
      ExecutiveObjective
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveObjectiveInput,
  ): ExecutiveObjective {

    const objective =
      createExecutiveObjective(
        input,
      );

    this.objectives.set(
      objective.id,
      objective,
    );

    this.timeline.record({
      id:
        `${objective.id}:created`,
      sessionId:
        objective.sessionId,
      type:
        "runtime-event",
      actorId:
        objective.ownerId,
      source:
        "executive-objective",
      title:
        objective.title,
      summary:
        objective.description,
      payload: {
        objectiveId:
          objective.id,
      },
    });

    return objective;
  }

  updateStatus(
    objectiveId: string,
    status:
      ExecutiveObjectiveStatus,
  ): ExecutiveObjective {

    const existing =
      this.objectives.get(
        objectiveId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive objective "${objectiveId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.objectives.set(
      objectiveId,
      updated,
    );

    this.timeline.record({
      id:
        `${objectiveId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-objective",
      title:
        updated.title,
      summary:
        `Objective status changed to ${status}.`,
      payload: {
        objectiveId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.objectives.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.objectives.values(),
      ),
    );
  }

  clear(): void {
    this.objectives.clear();
  }
}

export function
createExecutiveObjectiveService() {
  return new ExecutiveObjectiveService();
}
