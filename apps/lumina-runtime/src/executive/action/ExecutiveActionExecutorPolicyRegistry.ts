import type {
  ExecutiveExecutorCapability,
  ExecutiveExecutorScope,
  ExecutiveActionExecutorPolicy,
} from "./ExecutiveActionExecutorPolicy.js";

export interface EvaluateExecutiveExecutorPolicyInput {
  executorName:
    string;

  capability:
    ExecutiveExecutorCapability;

  scope:
    ExecutiveExecutorScope;

  projectId?:
    string;

  workspaceId?:
    string;
}

export interface ExecutiveExecutorPolicyDecision {
  readonly allowed:
    boolean;

  readonly reason:
    string;

  readonly executorName:
    string;

  readonly capability:
    ExecutiveExecutorCapability;

  readonly scope:
    ExecutiveExecutorScope;
}

export class ExecutiveActionExecutorPolicyRegistry {
  private readonly policies =
    new Map<
      string,
      ExecutiveActionExecutorPolicy
    >();

  register(
    policy:
      ExecutiveActionExecutorPolicy,
  ): void {
    if (
      this.policies.has(
        policy.executorName,
      )
    ) {
      throw new Error(
        "executive_executor_policy_already_registered",
      );
    }

    this.policies.set(
      policy.executorName,
      policy,
    );
  }

  get(
    executorName: string,
  ):
    | ExecutiveActionExecutorPolicy
    | undefined {
    return this.policies.get(
      executorName,
    );
  }

  list():
    readonly ExecutiveActionExecutorPolicy[] {
    return Object.freeze(
      Array.from(
        this.policies.values(),
      ),
    );
  }

  evaluate(
    input:
      EvaluateExecutiveExecutorPolicyInput,
  ): ExecutiveExecutorPolicyDecision {
    const executorName =
      input.executorName.trim();

    const policy =
      this.policies.get(
        executorName,
      );

    if (!policy) {
      return Object.freeze({
        allowed:
          false,

        reason:
          "executive_executor_policy_not_registered",

        executorName,

        capability:
          input.capability,

        scope:
          input.scope,
      });
    }

    if (
      policy
        .prohibitedCapabilities
        .includes(
          input.capability,
        )
    ) {
      return Object.freeze({
        allowed:
          false,

        reason:
          "executive_executor_capability_prohibited",

        executorName,

        capability:
          input.capability,

        scope:
          input.scope,
      });
    }

    if (
      !policy
        .capabilities
        .includes(
          input.capability,
        )
    ) {
      return Object.freeze({
        allowed:
          false,

        reason:
          "executive_executor_capability_not_declared",

        executorName,

        capability:
          input.capability,

        scope:
          input.scope,
      });
    }

    if (
      !policy
        .scopes
        .includes(
          input.scope,
        )
    ) {
      return Object.freeze({
        allowed:
          false,

        reason:
          "executive_executor_scope_not_allowed",

        executorName,

        capability:
          input.capability,

        scope:
          input.scope,
      });
    }

    if (
      policy.requiresProjectId &&
      !input.projectId?.trim()
    ) {
      return Object.freeze({
        allowed:
          false,

        reason:
          "executive_executor_project_scope_required",

        executorName,

        capability:
          input.capability,

        scope:
          input.scope,
      });
    }

    if (
      policy.requiresWorkspaceId &&
      !input.workspaceId?.trim()
    ) {
      return Object.freeze({
        allowed:
          false,

        reason:
          "executive_executor_workspace_scope_required",

        executorName,

        capability:
          input.capability,

        scope:
          input.scope,
      });
    }

    return Object.freeze({
      allowed:
        true,

      reason:
        "executive_executor_policy_allowed",

      executorName,

      capability:
        input.capability,

      scope:
        input.scope,
    });
  }

  clear(): void {
    this.policies.clear();
  }
}
