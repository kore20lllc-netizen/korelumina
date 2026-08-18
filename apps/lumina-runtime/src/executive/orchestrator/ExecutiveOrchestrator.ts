import type {
  ExecutiveEvent,
} from "../events/index.js";
import type {
  ExecutiveKernel,
} from "../kernel/index.js";
import type {
  ExecutivePipeline,
  ExecutivePipelineResult,
} from "./ExecutivePipeline.js";

export interface ExecutiveOrchestratorDependencies {
  kernel:
    ExecutiveKernel;

  pipeline:
    ExecutivePipeline;
}

export class ExecutiveOrchestrator {
  constructor(
    private readonly dependencies:
      ExecutiveOrchestratorDependencies,
  ) {}

  get kernel():
    ExecutiveKernel {
    return this.dependencies.kernel;
  }

  async publish(
    event: ExecutiveEvent,
  ): Promise<ExecutivePipelineResult> {
    const result =
      await this.dependencies
        .pipeline
        .process(event);

    if (
      result.lifecycle.stage ===
      "completed"
    ) {
      await this.dependencies
        .kernel
        .eventBus
        .publish(event);
    }

    return result;
  }
}
