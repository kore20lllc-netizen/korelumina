import {
  createExecutiveKernel,
  type ExecutiveKernel,
} from "../kernel/index.js";

import {
  ExecutiveKnowledgeContextReducer,
} from "../context/index.js";

import type {
  KnowledgeContextBuilder,
} from "../../knowledge-platform/context/index.js";
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

  knowledgeContextBuilder?:
    KnowledgeContextBuilder;
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

  const contextReducer =
    options.knowledgeContextBuilder
      ? new ExecutiveKnowledgeContextReducer(
          options.knowledgeContextBuilder,
        )
      : new DefaultExecutiveContextReducer();

  const pipeline =
    new ExecutivePipeline({
      kernel,

      validator:
        new StructuralExecutiveEventValidator(),

      contextReducer,

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
