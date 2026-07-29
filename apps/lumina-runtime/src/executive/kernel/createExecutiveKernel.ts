import {
  koreLuminaExecutiveConstitution,
} from "../constitution/index.js";
import {
  createExecutiveContext,
  type ExecutiveContext,
} from "../context/index.js";
import {
  InMemoryExecutiveEventBus,
  type ExecutiveEventBus,
} from "../events/index.js";
import {
  koreLuminaChiefAgentIdentity,
} from "../identity/index.js";
import {
  ExecutiveKernel,
} from "./ExecutiveKernel.js";

export interface CreateExecutiveKernelOptions {
  context?: ExecutiveContext;

  eventBus?: ExecutiveEventBus;
}

export function createExecutiveKernel(
  options:
    CreateExecutiveKernelOptions = {},
): ExecutiveKernel {
  return new ExecutiveKernel({
    identity:
      koreLuminaChiefAgentIdentity,

    constitution:
      koreLuminaExecutiveConstitution,

    context:
      options.context ??
      createExecutiveContext(),

    eventBus:
      options.eventBus ??
      new InMemoryExecutiveEventBus(),
  });
}
