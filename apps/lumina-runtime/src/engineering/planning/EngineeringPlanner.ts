import { randomUUID } from "node:crypto";

import type {
  EngineeringExecution,
} from "../execution/index.js";

import type {
  EngineeringPlan,
} from "./EngineeringPlan.js";

import type {
  EngineeringTask,
  EngineeringTaskType,
} from "./EngineeringTask.js";

function createTask(
  type: EngineeringTaskType,
  title: string,
  objective: string,
  dependsOn: string[],
  now: number,
): EngineeringTask {
  return {
    taskId: randomUUID(),
    type,
    title,
    objective,
    status: "planned",
    dependsOn,
    createdAt: now,
    updatedAt: now,
  };
}

export async function createEngineeringPlan(
  execution: EngineeringExecution,
): Promise<EngineeringPlan> {
  const now = Date.now();

  const analysis = createTask(
    "analysis",
    "Analyze Objective",
    execution.objective,
    [],
    now,
  );

  const workspace = createTask(
    "workspace",
    "Prepare Workspace",
    execution.objective,
    [analysis.taskId],
    now,
  );

  const implementation = createTask(
    "implementation",
    "Implement Changes",
    execution.objective,
    [workspace.taskId],
    now,
  );

  const validation = createTask(
    "validation",
    "Validate Build",
    execution.objective,
    [implementation.taskId],
    now,
  );

  const knowledge = createTask(
    "knowledge",
    "Capture Knowledge",
    execution.objective,
    [validation.taskId],
    now,
  );

  const reporting = createTask(
    "reporting",
    "Generate Report",
    execution.objective,
    [knowledge.taskId],
    now,
  );

  const completion = createTask(
    "completion",
    "Complete Execution",
    execution.objective,
    [reporting.taskId],
    now,
  );

  return {
    planId: randomUUID(),
    executionId: execution.executionId,
    objective: execution.objective,
    tasks: [
      analysis,
      workspace,
      implementation,
      validation,
      knowledge,
      reporting,
      completion,
    ],
    createdAt: now,
    updatedAt: now,
    metadata: {},
  };
}
