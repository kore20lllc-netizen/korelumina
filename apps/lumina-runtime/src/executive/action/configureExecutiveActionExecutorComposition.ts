import {
  createExecutiveActionExecutorPolicy,
} from "./ExecutiveActionExecutorPolicy.js";

import {
  ExecutiveActionExecutorPolicyRegistry,
} from "./ExecutiveActionExecutorPolicyRegistry.js";

import {
  ExecutiveActionExecutorRegistry,
} from "./ExecutiveActionExecutorRegistry.js";

import {
  ProjectFilesystemReadExecutor,
} from "./ProjectFilesystemReadExecutor.js";

import {
  ProjectFilesystemReplaceExecutor,
} from "./ProjectFilesystemReplaceExecutor.js";

export interface ConfigureExecutiveActionExecutorCompositionInput {
  readonly policyRegistry:
    ExecutiveActionExecutorPolicyRegistry;

  readonly executorRegistry:
    ExecutiveActionExecutorRegistry;

  readonly mutationEnabled:
    boolean;
}

export function configureExecutiveActionExecutorComposition(
  input:
    ConfigureExecutiveActionExecutorCompositionInput,
): void {
  input.policyRegistry.register(
    createExecutiveActionExecutorPolicy({
      executorName:
        "project-filesystem-read",

      capabilities: [
        "filesystem:read",
      ],

      scopes: [
        "project",
      ],

      prohibitedCapabilities: [
        "filesystem:write",
        "filesystem:delete",
        "process:spawn",
        "network:request",
        "git:write",
        "runtime:start",
        "runtime:stop",
        "runtime:restart",
        "deployment:write",
      ],

      requiresProjectId:
        true,
    }),
  );

  input.executorRegistry.register(
    "filesystem.read",
    new ProjectFilesystemReadExecutor(),
  );

  if (
    !input.mutationEnabled
  ) {
    return;
  }

  input.policyRegistry.register(
    createExecutiveActionExecutorPolicy({
      executorName:
        "project-filesystem-replace",

      capabilities: [
        "filesystem:write",
      ],

      scopes: [
        "project",
      ],

      prohibitedCapabilities: [
        "filesystem:delete",
        "process:spawn",
        "network:request",
        "git:write",
        "runtime:start",
        "runtime:stop",
        "runtime:restart",
        "deployment:write",
      ],

      requiresProjectId:
        true,

      metadata: {
        activationGate:
          "LUMINA_EXECUTIVE_MUTATION_ENABLED",

        mutationType:
          "filesystem.replace",

        existingFileOnly:
          true,

        expectedSha256Required:
          true,

        compensationRequired:
          true,
      },
    }),
  );

  input.executorRegistry.register(
    "filesystem.replace",
    new ProjectFilesystemReplaceExecutor(),
  );
}
