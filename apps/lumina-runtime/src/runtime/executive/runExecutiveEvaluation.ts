import {
  createRuntimeExecutiveService,
  createRuntimeExecutiveEventPublisher,
} from "./index.js";

import type {
  RuntimeCapabilityMetrics,
} from "../../executive/runtime/index.js";

const runtimeExecutive =
  createRuntimeExecutiveService();

const publisher =
  createRuntimeExecutiveEventPublisher();

export function
runExecutiveEvaluation(
  metrics:
    RuntimeCapabilityMetrics,
) {

  const evaluation =
    runtimeExecutive.evaluateRuntime(
      metrics,
    );

  publisher.publish(
    evaluation,
  );

  return evaluation;
}
