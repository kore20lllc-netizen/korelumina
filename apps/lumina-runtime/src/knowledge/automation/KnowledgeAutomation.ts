import {
  recordCompletedTicket,
} from "../engineering/EngineeringRecorder.js";

import {
  recordDecision,
} from "../decision/DecisionRecorder.js";

import {
  recordRuntimeEvent,
} from "../runtime/index.js";

import {
  runLearningPipeline,
} from "../learning/index.js";

import {
  runOrganizationalMemoryPipeline,
} from "../organizational-memory/index.js";

import type {
  EngineeringCompletionRequest,
  EngineeringCompletionResult,
} from "./types.js";

export async function completeEngineeringPhase(
  request: EngineeringCompletionRequest,
): Promise<EngineeringCompletionResult> {
  const ticket =
    recordCompletedTicket(
      request.ticket,
    );

  const decision =
    request.decision
      ? recordDecision(
          request.decision,
        )
      : undefined;

  const runtimeEvents =
    (request.runtimeEvents ?? []).map(
      (event) =>
        recordRuntimeEvent(event),
    );

  const learning =
    request.learningInput
      ? runLearningPipeline(
          request.learningInput as never,
        )
      : undefined;

  const organizationalMemory =
    request.organizationalMemoryInput
      ? await runOrganizationalMemoryPipeline(
          request.organizationalMemoryInput as never,
        )
      : undefined;

  return {
    ticket,
    decision,
    runtimeEvents,
    learning,
    organizationalMemory,
  };
}
