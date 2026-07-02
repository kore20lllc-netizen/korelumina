import {
  runExecutionPipeline,
  type ExecutionResult,
  type ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "./EngineeringAutomationContext.js";

import {
  InitializeStage,
  ValidateStage,
  ExecuteStage,
  CaptureKnowledgeStage,
  ProjectKnowledgeStage,
  GovernStage,
  ReportStage,
  FinalizeStage,
} from "./Stages/index.js";

export async function runEngineeringAutomation(
  input: EngineeringAutomationInput,
): Promise<ExecutionResult> {
  const stages: ExecutionStage<
    EngineeringAutomationInput,
    EngineeringAutomationState
  >[] = [
    InitializeStage,
    ValidateStage,
    ExecuteStage,
    CaptureKnowledgeStage,
    ProjectKnowledgeStage,
    GovernStage,
    ReportStage,
    FinalizeStage,
  ];

  return runExecutionPipeline(
    {
      id: `engineering:${input.projectId ?? "global"}:${Date.now()}`,
      input,
      state: {},
      metadata: {
        projectId: input.projectId,
        objective: input.objective,
      },
    },
    stages,
  );
}
