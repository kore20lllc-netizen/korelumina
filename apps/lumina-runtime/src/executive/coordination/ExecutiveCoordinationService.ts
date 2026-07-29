import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveCoordination,
  type CreateExecutiveCoordinationInput,
  type ExecutiveCoordination,
  type ExecutiveCoordinationStatus,
} from "./ExecutiveCoordination.js";

export class ExecutiveCoordinationService {

  private readonly coordinations =
    new Map<
      string,
      ExecutiveCoordination
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveCoordinationInput,
  ): ExecutiveCoordination {

    const coordination =
      createExecutiveCoordination(
        input,
      );

    this.coordinations.set(
      coordination.id,
      coordination,
    );

    this.timeline.record({
      id:
        `${coordination.id}:created`,
      sessionId:
        coordination.sessionId,
      type:
        "delegation",
      actorId:
        coordination.coordinatorId,
      source:
        "executive-coordination",
      title:
        coordination.title,
      summary:
        coordination.objective,
      payload: {
        coordinationId:
          coordination.id,
      },
    });

    return coordination;
  }

  updateStatus(
    coordinationId: string,
    status:
      ExecutiveCoordinationStatus,
  ): ExecutiveCoordination {

    const existing =
      this.coordinations.get(
        coordinationId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive coordination "${coordinationId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.coordinations.set(
      coordinationId,
      updated,
    );

    this.timeline.record({
      id:
        `${coordinationId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.coordinatorId,
      source:
        "executive-coordination",
      title:
        updated.title,
      summary:
        `Coordination status changed to ${status}.`,
      payload: {
        coordinationId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.coordinations.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.coordinations.values(),
      ),
    );
  }

  clear(): void {
    this.coordinations.clear();
  }
}

export function
createExecutiveCoordinationService() {
  return new ExecutiveCoordinationService();
}
