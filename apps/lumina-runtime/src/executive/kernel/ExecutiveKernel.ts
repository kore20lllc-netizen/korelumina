import type {
  ExecutiveConstitution,
} from "../constitution/index.js";
import type {
  ExecutiveContext,
} from "../context/index.js";
import type {
  ExecutiveEventBus,
} from "../events/index.js";
import type {
  ExecutiveIdentity,
} from "../identity/index.js";

export interface ExecutiveKernelDependencies {
  identity:
    ExecutiveIdentity;

  constitution:
    ExecutiveConstitution;

  context:
    ExecutiveContext;

  eventBus:
    ExecutiveEventBus;
}

export interface ExecutiveKernelSnapshot {
  identity:
    ExecutiveIdentity;

  constitutionVersion:
    string;

  context:
    ExecutiveContext;
}

export class ExecutiveKernel {
  private context:
    ExecutiveContext;

  constructor(
    private readonly dependencies:
      ExecutiveKernelDependencies,
  ) {
    this.context =
      dependencies.context;
  }

  get identity():
    ExecutiveIdentity {
    return (
      this.dependencies.identity
    );
  }

  get constitution():
    ExecutiveConstitution {
    return (
      this.dependencies
        .constitution
    );
  }

  get eventBus():
    ExecutiveEventBus {
    return (
      this.dependencies.eventBus
    );
  }

  getContext():
    ExecutiveContext {
    return this.context;
  }

  replaceContext(
    context: ExecutiveContext,
  ): ExecutiveContext {
    this.context = context;

    return this.context;
  }

  snapshot():
    ExecutiveKernelSnapshot {
    return {
      identity:
        this.identity,

      constitutionVersion:
        this.constitution.version,

      context:
        this.context,
    };
  }
}
