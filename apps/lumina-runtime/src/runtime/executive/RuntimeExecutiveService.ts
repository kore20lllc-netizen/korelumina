import {
  ExecutiveRuntimeEvaluationService,
} from "../../executive/runtime/index.js";

import type {
  RuntimeCapabilityMetrics,
} from "../../executive/runtime/index.js";

export class RuntimeExecutiveService {

  private readonly evaluation =
    new ExecutiveRuntimeEvaluationService();

  evaluateRuntime(
    metrics:
      RuntimeCapabilityMetrics,
  ) {

    return this.evaluation.evaluate(
      metrics,
    );
  }
}

export function
createRuntimeExecutiveService() {

  return new RuntimeExecutiveService();
}
