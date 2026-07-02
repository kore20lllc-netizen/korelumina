import type {
  EngineeringCompletionInput,
  EngineeringCompletionReport,
} from "../knowledge/automation/EngineeringCompletionOrchestrator.js";

import {
  completeEngineeringPhase,
} from "../knowledge/automation/EngineeringCompletionOrchestrator.js";

import {
  startRuntimeLifecycle,
  restartRuntimeLifecycle,
  recoverRuntimeLifecycle,
  shutdownRuntimeLifecycle,
  shutdownAllRuntimeLifecycles,
} from "../runtime/lifecycle/index.js";

export async function completeEngineeringWork(
  input: EngineeringCompletionInput,
): Promise<EngineeringCompletionReport> {
  return completeEngineeringPhase(input);
}

export async function startEngineeringRuntime(
  projectId: string,
) {
  return startRuntimeLifecycle(projectId);
}

export async function restartEngineeringRuntime(
  projectId: string,
) {
  return restartRuntimeLifecycle(projectId);
}

export async function recoverEngineeringRuntimes() {
  return recoverRuntimeLifecycle();
}

export async function shutdownEngineeringRuntime(
  projectId: string,
) {
  return shutdownRuntimeLifecycle(projectId);
}

export async function shutdownAllEngineeringRuntimes() {
  return shutdownAllRuntimeLifecycles();
}
