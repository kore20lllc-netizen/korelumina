import {
  createExecutiveKernel,
  type ExecutiveKernel,
} from "../kernel/index.js";
import {
  RegistryExecutiveDispatcher,
} from "./ExecutiveDispatcher.js";
import {
  DefaultExecutiveContextReducer,
  ExecutivePipeline,
  StructuralExecutiveEventValidator,
} from "./ExecutivePipeline.js";
import {
  ExecutiveOrchestrator,
} from "./ExecutiveOrchestrator.js";
import {
  DefaultExecutiveRouter,
} from "./ExecutiveRouter.js";

export interface CreateExecutiveOrchestratorOptions {
  kernel?: ExecutiveKernel;

  dispatcher?:
    RegistryExecutiveDispatcher;
}

export interface ExecutiveOrchestratorRuntime {
  orchestrator:
    ExecutiveOrchestrator;

  kernel:
    ExecutiveKernel;

  dispatcher:
    RegistryExecutiveDispatcher;
}

export function createExecutiveOrchestrator(
  options:
    CreateExecutiveOrchestratorOptions = {},
): ExecutiveOrchestratorRuntime {
  const kernel =
    options.kernel ??
    createExecutiveKernel();

  const dispatcher =
    options.dispatcher ??
    new RegistryExecutiveDispatcher();

  const pipeline =
    new ExecutivePipeline({
      kernel,

      validator:
        new StructuralExecutiveEventValidator(),

      contextReducer:
        new DefaultExecutiveContextReducer(),

      router:
        new DefaultExecutiveRouter(),

      dispatcher,
    });

  return {
    kernel,

    dispatcher,

    orchestrator:
      new ExecutiveOrchestrator({
        kernel,
        pipeline,
      }),
  };
}
