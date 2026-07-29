import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveExecution,
  type CreateExecutiveExecutionInput,
  type ExecutiveExecution,
  type ExecutiveExecutionStatus,
} from "./ExecutiveExecution.js";

export class ExecutiveExecutionService {

  private readonly executions =
    new Map<
      string,
      ExecutiveExecution
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveExecutionInput,
  ): ExecutiveExecution {

    const execution =
      createExecutiveExecution(
        input,
      );

    this.executions.set(
      execution.id,
      execution,
    );

    this.timeline.record({
      id:
        `${execution.id}:created`,
      sessionId:
        execution.sessionId,
      type:
        "runtime-event",
      actorId:
        execution.ownerId,
      source:
        "executive-execution",
      title:
        execution.title,
      summary:
        execution.description,
      payload: {
        executionId:
          execution.id,
        progress:
          execution.progress,
      },
    });

    return execution;
  }

  updateStatus(
    executionId: string,
    status:
      ExecutiveExecutionStatus,
  ): ExecutiveExecution {

    const existing =
      this.executions.get(
        executionId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive execution "${executionId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.executions.set(
      executionId,
      updated,
    );

    this.timeline.record({
      id:
        `${executionId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-execution",
      title:
        updated.title,
      summary:
        `Execution status changed to ${status}.`,
      payload: {
        executionId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.executions.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.executions.values(),
      ),
    );
  }

  clear(): void {
    this.executions.clear();
  }
}

export function
createExecutiveExecutionService() {
  return new ExecutiveExecutionService();
}
