export type ExecutiveExecutorCapability =
  | "filesystem:read"
  | "filesystem:write"
  | "filesystem:delete"
  | "process:spawn"
  | "network:request"
  | "git:read"
  | "git:write"
  | "runtime:start"
  | "runtime:stop"
  | "runtime:restart"
  | "deployment:read"
  | "deployment:write";

export type ExecutiveExecutorScope =
  | "project"
  | "workspace"
  | "organization"
  | "platform";

export interface ExecutiveActionExecutorPolicy {
  readonly executorName:
    string;

  readonly capabilities:
    readonly ExecutiveExecutorCapability[];

  readonly scopes:
    readonly ExecutiveExecutorScope[];

  readonly prohibitedCapabilities:
    readonly ExecutiveExecutorCapability[];

  readonly requiresProjectId:
    boolean;

  readonly requiresWorkspaceId:
    boolean;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveActionExecutorPolicyInput {
  executorName:
    string;

  capabilities:
    readonly ExecutiveExecutorCapability[];

  scopes:
    readonly ExecutiveExecutorScope[];

  prohibitedCapabilities?:
    readonly ExecutiveExecutorCapability[];

  requiresProjectId?:
    boolean;

  requiresWorkspaceId?:
    boolean;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function createExecutiveActionExecutorPolicy(
  input:
    CreateExecutiveActionExecutorPolicyInput,
): ExecutiveActionExecutorPolicy {
  const executorName =
    input.executorName.trim();

  if (!executorName) {
    throw new Error(
      "executive_executor_policy_name_required",
    );
  }

  const capabilities =
    Array.from(
      new Set(
        input.capabilities,
      ),
    );

  const scopes =
    Array.from(
      new Set(
        input.scopes,
      ),
    );

  const prohibitedCapabilities =
    Array.from(
      new Set(
        input.prohibitedCapabilities ??
        [],
      ),
    );

  for (
    const prohibited
    of prohibitedCapabilities
  ) {
    if (
      capabilities.includes(
        prohibited,
      )
    ) {
      throw new Error(
        "executive_executor_policy_capability_conflict",
      );
    }
  }

  return Object.freeze({
    executorName,

    capabilities:
      Object.freeze(
        capabilities,
      ),

    scopes:
      Object.freeze(
        scopes,
      ),

    prohibitedCapabilities:
      Object.freeze(
        prohibitedCapabilities,
      ),

    requiresProjectId:
      input.requiresProjectId ??
      false,

    requiresWorkspaceId:
      input.requiresWorkspaceId ??
      false,

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),
  });
}
