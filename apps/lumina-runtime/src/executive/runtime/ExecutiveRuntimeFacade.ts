import type {
  ExecutiveCapabilitySummary,
} from "./ExecutiveRuntime.js";

import {
  ExecutiveRuntimeOrchestrator,
  type ExecutiveRuntimeExecution,
} from "./ExecutiveRuntimeOrchestrator.js";

export interface ExecutiveRuntimeRequest {

  readonly capabilities:
    readonly ExecutiveCapabilitySummary[];
}

export class ExecutiveRuntimeFacade {

  private readonly orchestrator =
    new ExecutiveRuntimeOrchestrator();

  evaluate(
    request:
      ExecutiveRuntimeRequest,
  ): ExecutiveRuntimeExecution {

    return this.orchestrator.run(
      request.capabilities,
    );
  }
}

export function
createExecutiveRuntimeFacade() {

  return new ExecutiveRuntimeFacade();
}
