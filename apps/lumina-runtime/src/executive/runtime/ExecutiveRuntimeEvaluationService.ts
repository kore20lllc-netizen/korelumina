import {
  ExecutiveRuntimeFacade,
} from "./ExecutiveRuntimeFacade.js";

import {
  RuntimeCapabilityAdapter,
  type RuntimeCapabilityMetrics,
} from "./RuntimeCapabilityAdapter.js";

import type {
  ExecutiveRuntimeExecution,
} from "./ExecutiveRuntimeOrchestrator.js";

export class ExecutiveRuntimeEvaluationService {

  private readonly adapter =
    new RuntimeCapabilityAdapter();

  private readonly facade =
    new ExecutiveRuntimeFacade();

  evaluate(
    metrics:
      RuntimeCapabilityMetrics,
  ): ExecutiveRuntimeExecution {

    const capabilities =
      this.adapter.adapt(
        metrics,
      );

    return this.facade.evaluate({

      capabilities,
    });
  }
}

export function
createExecutiveRuntimeEvaluationService() {

  return new ExecutiveRuntimeEvaluationService();
}
