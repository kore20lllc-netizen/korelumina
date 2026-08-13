import {
  ExecutiveAuditService,
} from "../audit/index.js";

import {
  ExecutiveDelegationService,
} from "../delegation/index.js";

import {
  ExecutiveActionService,
} from "./ExecutiveActionService.js";

import type {
  ExecutiveActionExecutor,
  ExecutiveActionExecutionResult,
} from "./ExecutiveActionExecutor.js";

import {
  ExecutiveActionExecutionAuthorizationService,
} from "./ExecutiveActionExecutionAuthorizationService.js";

import {
  ExecutiveActionExecutionOutcomeService,
  type ExecutiveActionExecutionOutcomeResult,
} from "./ExecutiveActionExecutionOutcomeService.js";


import {
  resolveExecutiveActionExecutionOperationPolicy,
  validateExecutiveActionExecutionOperation,
  type ExecutiveActionExecutionOperation,
} from "./ExecutiveActionExecutionOperation.js";


import {
  ExecutiveActionExecutorPolicyRegistry,
} from "./ExecutiveActionExecutorPolicyRegistry.js";

export interface ExecuteExecutiveActionInput {
  actionId:
    string;

  actorId:
    string;

  authorizationId:
    string;

  startAuditId:
    string;

  operation:
    ExecutiveActionExecutionOperation;
}

export class ExecutiveActionExecutorService {
  constructor(
    private readonly actionService:
      ExecutiveActionService,

    private readonly delegationService:
      ExecutiveDelegationService,

    private readonly authorizationService:
      ExecutiveActionExecutionAuthorizationService,

    private readonly auditService:
      ExecutiveAuditService,

    private readonly outcomeService:
      ExecutiveActionExecutionOutcomeService,

    private readonly policyRegistry:
      ExecutiveActionExecutorPolicyRegistry,

    private readonly executor:
      ExecutiveActionExecutor,
  ) {}

  async execute(
    input:
      ExecuteExecutiveActionInput,
  ): Promise<
    ExecutiveActionExecutionOutcomeResult
  > {
    const action =
      this.actionService.get(
        input.actionId,
      );

    if (
      !action
    ) {
      throw new Error(
        "executive_action_not_found",
      );
    }

    if (
      action.status !==
      "running"
    ) {
      throw new Error(
        "executive_action_not_running_for_executor",
      );
    }

    const delegationId =
      action.delegationId;

    if (
      !delegationId
    ) {
      throw new Error(
        "executive_executor_delegation_required",
      );
    }

    const delegation =
      this.delegationService.get(
        delegationId,
      );

    if (
      !delegation
    ) {
      throw new Error(
        "executive_delegation_not_found",
      );
    }

    if (
      delegation.status !==
      "in-progress"
    ) {
      throw new Error(
        "executive_delegation_not_in_progress_for_executor",
      );
    }

    const actorId =
      input.actorId.trim();

    if (
      actorId.length ===
      0
    ) {
      throw new Error(
        "executive_executor_actor_required",
      );
    }

    if (
      actorId !==
      action.ownerId ||
      actorId !==
      delegation.assignedTo
    ) {
      throw new Error(
        "executive_executor_actor_not_authorized",
      );
    }

    const authorization =
      this.authorizationService.get(
        input.authorizationId,
      );

    if (
      !authorization
    ) {
      throw new Error(
        "executive_execution_authorization_not_found",
      );
    }

    if (
      authorization.actionId !==
      action.id ||
      authorization.delegationId !==
      delegation.id ||
      authorization.actorId !==
      actorId
    ) {
      throw new Error(
        "executive_executor_authorization_mismatch",
      );
    }

    if (
      authorization.consumedAt ===
      undefined
    ) {
      throw new Error(
        "executive_executor_authorization_not_consumed",
      );
    }

    const startAudit =
      this.auditService.get(
        input.startAuditId,
      );

    if (
      !startAudit
    ) {
      throw new Error(
        "executive_execution_start_audit_not_found",
      );
    }

    if (
      startAudit.source !==
        "executive-action-execution-start" ||
      startAudit.metadata.actionId !==
        action.id ||
      startAudit.metadata.delegationId !==
        delegation.id ||
      startAudit.metadata.authorizationId !==
        authorization.id ||
      startAudit.ownerId !==
        actorId
    ) {
      throw new Error(
        "executive_executor_start_audit_mismatch",
      );
    }

    const projectId =
      typeof action.metadata
        .projectId ===
        "string"
        ? action.metadata
            .projectId
            .trim()
        : undefined;

    const workspaceId =
      typeof action.metadata
        .workspaceId ===
        "string"
        ? action.metadata
            .workspaceId
            .trim()
        : undefined;

    validateExecutiveActionExecutionOperation(
      input.operation,
    );

    const operationPolicy =
      resolveExecutiveActionExecutionOperationPolicy(
        input.operation,
      );

    const policyDecision =
      this.policyRegistry.evaluate({
        executorName:
          this.executor.name,

        capability:
          operationPolicy.capability,

        scope:
          operationPolicy.scope,

        projectId:
          projectId ||
          undefined,

        workspaceId:
          workspaceId ||
          undefined,
      });

    if (
      !policyDecision.allowed
    ) {
      throw new Error(
        policyDecision.reason,
      );
    }

    let result:
      ExecutiveActionExecutionResult;

    try {
      result =
        await this.executor.execute({
          action,
          actorId,
          startAuditId:
            startAudit.id,
          authorizationId:
            authorization.id,

          operation:
            input.operation,
        });
    } catch (error) {
      result = {
        ok:
          false,

        reason:
          error instanceof Error
            ? error.message
            : String(
                error,
              ),

        evidence:
          [],

        compensationRequired:
          false,

        metadata: {
          executor:
            this.executor.name,

          executorThrew:
            true,
        },
      };
    }

    if (
      result.ok
    ) {
      const summary =
        result.summary.trim();

      if (
        summary.length ===
        0
      ) {
        throw new Error(
          "executive_executor_success_summary_required",
        );
      }

      return this.outcomeService
        .complete({
          actionId:
            action.id,

          actorId,

          startAuditId:
            startAudit.id,

          resultSummary:
            summary,

          evidence:
            result.evidence,
        });
    }

    const reason =
      result.reason.trim();

    if (
      reason.length ===
      0
    ) {
      throw new Error(
        "executive_executor_failure_reason_required",
      );
    }

    return this.outcomeService
      .fail({
        actionId:
          action.id,

        actorId,

        startAuditId:
          startAudit.id,

        failureReason:
          reason,

        compensationRequired:
          result.compensationRequired,

        compensationPlan:
          result.compensationPlan,

        evidence:
          result.evidence,
      });
  }
}
