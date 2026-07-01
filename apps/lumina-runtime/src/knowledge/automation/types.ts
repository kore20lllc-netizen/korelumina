import type {
  CompletedEngineeringTicket,
} from "../engineering/EngineeringRecorder.js";

import type {
  Decision,
} from "../decision/Decision.js";

import type {
  RecordRuntimeEventInput,
  RuntimeEvent,
} from "../runtime/index.js";

import type {
  LearningPipelineResult,
} from "../learning/index.js";

import type {
  OrganizationalMemoryPipelineResult,
} from "../organizational-memory/index.js";

export interface EngineeringCompletionRequest {
  ticket: CompletedEngineeringTicket;

  decision?: Decision;

  runtimeEvents?: RecordRuntimeEventInput[];

  learningInput?: unknown;

  organizationalMemoryInput?: unknown;
}

export interface EngineeringCompletionResult {
  ticket: CompletedEngineeringTicket;

  decision?: Decision;

  runtimeEvents: RuntimeEvent[];

  learning?: LearningPipelineResult;

  organizationalMemory?: OrganizationalMemoryPipelineResult;
}
