import { randomUUID } from "node:crypto";

import type {
  EngineeringExecution,
} from "../execution/index.js";

import type {
  EngineeringPlan,
} from "./EngineeringPlan.js";

import type {
  EngineeringTask,
} from "./EngineeringTask.js";

export async function createEngineeringPlan(
  execution: EngineeringExecution,
): Promise<EngineeringPlan> {
  const now = Date.now();

  const task: EngineeringTask = {
    taskId: randomUUID(),
    title: execution.objective,
    objective: execution.objective,
    status: "planned",
    dependsOn: [],
    createdAt: now,
    updatedAt: now,
  };

  return {
    planId: randomUUID(),
    executionId: execution.executionId,
    objective: execution.objective,
    tasks: [task],
    createdAt: now,
    updatedAt: now,
    metadata: {},
  };
}
