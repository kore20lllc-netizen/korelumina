import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAction,
  type CreateExecutiveActionInput,
  type ExecutiveAction,
  type ExecutiveActionStatus,
} from "./ExecutiveAction.js";

export class ExecutiveActionService {

  private readonly actions =
    new Map<
      string,
      ExecutiveAction
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveActionInput,
  ): ExecutiveAction {

    const action =
      createExecutiveAction(
        input,
      );

    this.actions.set(
      action.id,
      action,
    );

    this.timeline.record({
      id:
        `${action.id}:created`,
      sessionId:
        action.sessionId,
      type:
        "runtime-event",
      actorId:
        action.ownerId,
      source:
        "executive-action",
      title:
        action.title,
      summary:
        "Action created.",
      payload: {
        actionId:
          action.id,
      },
    });

    return action;
  }

  updateStatus(
    actionId: string,
    status:
      ExecutiveActionStatus,
  ): ExecutiveAction {

    const existing =
      this.actions.get(
        actionId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive action "${actionId}".`,
      );
    }

    const now =
      Date.now();

    const updated =
      Object.freeze({
        ...existing,
        status,
        startedAt:
          status === "running"
            ? existing.startedAt ??
              now
            : existing.startedAt,
        completedAt:
          status ===
            "completed"
            ? now
            : existing.completedAt,
        updatedAt:
          now,
      });

    this.actions.set(
      actionId,
      updated,
    );

    this.timeline.record({
      id:
        `${actionId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-action",
      title:
        updated.title,
      summary:
        `Action status changed to ${status}.`,
      payload: {
        actionId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.actions.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.actions.values(),
      ),
    );
  }

  clear(): void {
    this.actions.clear();
  }
}

export function
createExecutiveActionService() {
  return new ExecutiveActionService();
}
