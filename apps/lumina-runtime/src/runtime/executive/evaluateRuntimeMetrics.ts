import {
  createRuntimeExecutiveService,
} from "./RuntimeExecutiveService.js";

import type {
  RuntimeCapabilityMetrics,
} from "../../executive/runtime/index.js";

const executive =
  createRuntimeExecutiveService();

export function
evaluateRuntimeMetrics(
  metrics:
    RuntimeCapabilityMetrics,
) {

  return executive.evaluateRuntime(
    metrics,
  );
}
