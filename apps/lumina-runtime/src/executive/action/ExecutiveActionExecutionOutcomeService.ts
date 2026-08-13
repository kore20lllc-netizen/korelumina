import {
  ExecutiveAuditService,
  type ExecutiveAudit,
} from "../audit/index.js";

import {
  ExecutiveDelegationService,
  type ExecutiveDelegation,
} from "../delegation/index.js";

import type {
  ExecutiveAction,
} from "./ExecutiveAction.js";

import {
  ExecutiveActionService,
} from "./ExecutiveActionService.js";

interface ResolveExecutiveActionExecutionInput {
  actionId:
    string;

  actorId:
    string;

  startAuditId:
    string;
}

export interface CompleteExecutiveActionExecutionInput
  extends ResolveExecutiveActionExecutionInput {
  resultSummary:
    string;

  evidence?:
    readonly string[];
}

export interface FailExecutiveActionExecutionInput
  extends ResolveExecutiveActionExecutionInput {
  failureReason:
    string;

  compensationRequired:
    boolean;

  compensationPlan?:
    string;

  evidence?:
    readonly string[];
}

export interface ExecutiveActionExecutionOutcomeResult {
  action:
    ExecutiveAction;

  delegation:
    ExecutiveDelegation;

  audit:
    ExecutiveAudit;
}

interface ValidExecutionContext {
  action:
    ExecutiveAction;

  delegation:
    ExecutiveDelegation;

  startAudit:
    ExecutiveAudit;

  actorId:
    string;

  decisionEvidence:
    readonly string[];
}

export class ExecutiveActionExecutionOutcomeService {
  constructor(
    private readonly actionService:
      ExecutiveActionService,

    private readonly delegationService:
      ExecutiveDelegationService,

    private readonly auditService:
      ExecutiveAuditService,
  ) {}

  complete(
    input:
      CompleteExecutiveActionExecutionInput,
  ): ExecutiveActionExecutionOutcomeResult {
    const context =
      this.resolveContext(
        input,
      );

    const resultSummary =
      input.resultSummary.trim();

    if (
      resultSummary.length ===
      0
    ) {
      throw new Error(
        "executive_execution_result_summary_required",
      );
    }

    /*
     * Post-execution audit is written before terminal
     * action/delegation state changes.
     */
    const audit =
      this.auditService.create({
        id:
          `audit:execution-completed:${context.action.id}`,

        sessionId:
          context.action.sessionId,

        title:
          `Execution completed: ${context.action.title}`,

        description:
          resultSummary,

        source:
          "executive-action-execution-completed",

        ownerId:
          context.actorId,

        severity:
          "info",

        status:
          "closed",

        evidence:
          this.mergeEvidence(
            context,
            input.evidence,
          ),

        metadata: {
          actionId:
            context.action.id,

          delegationId:
            context.delegation.id,

          actorId:
            context.actorId,

          startAuditId:
            context.startAudit.id,

          decisionId:
            context.action.metadata
              .decisionId,

          outcome:
            "completed",

          resultSummary,
        },
      });

    const completedAction =
      this.actionService
        .updateStatus(
          context.action.id,
          "completed",
        );

    const completedDelegation =
      this.delegationService
        .updateStatus(
          context.delegation.id,
          "completed",
        );

    return {
      action:
        completedAction,

      delegation:
        completedDelegation,

      audit,
    };
  }

  fail(
    input:
      FailExecutiveActionExecutionInput,
  ): ExecutiveActionExecutionOutcomeResult {
    const context =
      this.resolveContext(
        input,
      );

    const failureReason =
      input.failureReason.trim();

    if (
      failureReason.length ===
      0
    ) {
      throw new Error(
        "executive_execution_failure_reason_required",
      );
    }

    const compensationPlan =
      input.compensationPlan
        ?.trim();

    if (
      input.compensationRequired &&
      !compensationPlan
    ) {
      throw new Error(
        "executive_execution_compensation_plan_required",
      );
    }

    /*
     * Failure is audited before terminal state mutation.
     * A required compensation remains an explicit open
     * governance obligation; this service does not perform it.
     */
    const audit =
      this.auditService.create({
        id:
          `audit:execution-failed:${context.action.id}`,

        sessionId:
          context.action.sessionId,

        title:
          `Execution failed: ${context.action.title}`,

        description:
          failureReason,

        source:
          "executive-action-execution-failed",

        ownerId:
          context.actorId,

        severity:
          "error",

        status:
          input.compensationRequired
            ? "open"
            : "closed",

        evidence:
          this.mergeEvidence(
            context,
            input.evidence,
          ),

        recommendations:
          input.compensationRequired &&
          compensationPlan
            ? [
                compensationPlan,
              ]
            : [],

        metadata: {
          actionId:
            context.action.id,

          delegationId:
            context.delegation.id,

          actorId:
            context.actorId,

          startAuditId:
            context.startAudit.id,

          decisionId:
            context.action.metadata
              .decisionId,

          outcome:
            "failed",

          failureReason,

          compensationRequired:
            input.compensationRequired,

          compensationPlan:
            compensationPlan ??
            null,

          compensationStatus:
            input.compensationRequired
              ? "required"
              : "not-required",
        },
      });

    const failedAction =
      this.actionService
        .updateStatus(
          context.action.id,
          "failed",
        );

    const failedDelegation =
      this.delegationService
        .updateStatus(
          context.delegation.id,
          "failed",
        );

    return {
      action:
        failedAction,

      delegation:
        failedDelegation,

      audit,
    };
  }

  private resolveContext(
    input:
      ResolveExecutiveActionExecutionInput,
  ): ValidExecutionContext {
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
        "executive_action_not_running_for_execution_outcome",
      );
    }

    const delegationId =
      action.delegationId;

    if (
      !delegationId
    ) {
      throw new Error(
        "executive_execution_outcome_delegation_required",
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
        "executive_delegation_not_in_progress_for_execution_outcome",
      );
    }

    if (
      action.ownerId !==
      delegation.assignedTo
    ) {
      throw new Error(
        "executive_execution_outcome_owner_mismatch",
      );
    }

    const actorId =
      input.actorId.trim();

    if (
      actorId.length ===
      0
    ) {
      throw new Error(
        "executive_execution_outcome_actor_required",
      );
    }

    if (
      actorId !==
      action.ownerId
    ) {
      throw new Error(
        "executive_execution_outcome_actor_not_authorized",
      );
    }

    const startAuditId =
      input.startAuditId.trim();

    if (
      startAuditId.length ===
      0
    ) {
      throw new Error(
        "executive_execution_start_audit_id_required",
      );
    }

    const startAudit =
      this.auditService.get(
        startAuditId,
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
      "executive-action-execution-start"
    ) {
      throw new Error(
        "executive_execution_start_audit_invalid",
      );
    }

    if (
      startAudit.metadata.actionId !==
      action.id
    ) {
      throw new Error(
        "executive_execution_start_audit_action_mismatch",
      );
    }

    if (
      startAudit.metadata.delegationId !==
      delegation.id
    ) {
      throw new Error(
        "executive_execution_start_audit_delegation_mismatch",
      );
    }

    if (
      startAudit.ownerId !==
      actorId
    ) {
      throw new Error(
        "executive_execution_start_audit_actor_mismatch",
      );
    }

    const decisionEvidence =
      action.metadata
        .decisionEvidence;

    if (
      !Array.isArray(
        decisionEvidence,
      ) ||
      decisionEvidence.length ===
        0
    ) {
      throw new Error(
        "executive_execution_outcome_evidence_required",
      );
    }

    return {
      action,
      delegation,
      startAudit,
      actorId,

      decisionEvidence:
        decisionEvidence.filter(
          (
            value,
          ): value is string =>
            typeof value ===
            "string",
        ),
    };
  }

  private mergeEvidence(
    context:
      ValidExecutionContext,

    additional:
      readonly string[] | undefined,
  ): readonly string[] {
    return Object.freeze(
      Array.from(
        new Set([
          ...context
            .decisionEvidence,

          context
            .startAudit
            .id,

          ...(additional ??
            []),
        ]),
      ),
    );
  }
}
