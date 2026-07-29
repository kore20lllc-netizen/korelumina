import type {
  ExecutiveCapabilitySummary,
} from "./ExecutiveRuntime.js";

import {
  ExecutiveCoordinator,
  type ExecutiveRuntimeResult,
} from "./ExecutiveCoordinator.js";

import {
  ExecutiveExecutionEngine,
  type ExecutiveRuntimeExecutionRecord,
} from "./ExecutiveExecutionEngine.js";

export interface ExecutiveRuntimeExecution {

  readonly result:
    ExecutiveRuntimeResult;

  readonly executions:
    readonly ExecutiveRuntimeExecutionRecord[];
}

export class ExecutiveRuntimeOrchestrator {

  private readonly coordinator =
    new ExecutiveCoordinator();

  private readonly execution =
    new ExecutiveExecutionEngine();

  run(
    capabilities:
      readonly ExecutiveCapabilitySummary[],
  ): ExecutiveRuntimeExecution {

    const result =
      this.coordinator.evaluate(
        capabilities,
      );

    const executions =
      this.execution.execute(
        result.decisions,
      );

    return Object.freeze({

      result,

      executions,
    });
  }
}

export function
createExecutiveRuntimeOrchestrator() {

  return new ExecutiveRuntimeOrchestrator();
}
