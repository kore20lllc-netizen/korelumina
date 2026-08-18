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

import type {
  ExecutiveActionExecutionAuthorization,
} from "./ExecutiveActionExecutionAuthorization.js";

import {
  ExecutiveActionExecutionAuthorizationService,
} from "./ExecutiveActionExecutionAuthorizationService.js";

export interface StartExecutiveActionExecutionInput {
  actionId:
    string;

  authorizationId:
    string;

  actorId:
    string;
}

export interface ExecutiveActionExecutionStartResult {
  action:
    ExecutiveAction;

  delegation:
    ExecutiveDelegation;

  authorization:
    ExecutiveActionExecutionAuthorization;

  audit:
    ExecutiveAudit;
}

export class ExecutiveActionExecutionStartService {
  constructor(
    private readonly actionService:
      ExecutiveActionService,

    private readonly delegationService:
      ExecutiveDelegationService,

    private readonly authorizationService:
      ExecutiveActionExecutionAuthorizationService,

    private readonly auditService =
      new ExecutiveAuditService(),
  ) {}

  start(
    input:
      StartExecutiveActionExecutionInput,
  ): ExecutiveActionExecutionStartResult {
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
      "ready"
    ) {
      throw new Error(
        "executive_action_not_ready_for_execution_start",
      );
    }

    const delegationId =
      action.delegationId;

    if (
      !delegationId
    ) {
      throw new Error(
        "executive_execution_start_delegation_required",
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
      "accepted"
    ) {
      throw new Error(
        "executive_delegation_not_accepted_for_execution_start",
      );
    }

    if (
      action.ownerId !==
      delegation.assignedTo
    ) {
      throw new Error(
        "executive_execution_start_owner_mismatch",
      );
    }

    const actorId =
      input.actorId.trim();

    if (
      actorId.length ===
      0
    ) {
      throw new Error(
        "executive_execution_starter_required",
      );
    }

    if (
      actorId !==
      action.ownerId
    ) {
      throw new Error(
        "executive_execution_starter_not_authorized",
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
      authorization.consumedAt !==
      undefined
    ) {
      throw new Error(
        "executive_execution_authorization_already_consumed",
      );
    }

    if (
      authorization.actionId !==
      action.id
    ) {
      throw new Error(
        "executive_execution_start_action_authorization_mismatch",
      );
    }

    if (
      authorization.delegationId !==
      delegation.id
    ) {
      throw new Error(
        "executive_execution_start_delegation_authorization_mismatch",
      );
    }

    if (
      authorization.actorId !==
      actorId
    ) {
      throw new Error(
        "executive_execution_start_actor_authorization_mismatch",
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
        "executive_execution_start_evidence_required",
      );
    }

    /*
     * The audit is intentionally created before any execution
     * state transition. No external executor is invoked here.
     */
    const audit =
      this.auditService.create({
        id:
          `audit:execution-start:${action.id}`,

        sessionId:
          action.sessionId,

        title:
          `Execution start: ${action.title}`,

        description:
          "Governed executive action execution authorized for start.",

        source:
          "executive-action-execution-start",

        ownerId:
          actorId,

        severity:
          "info",

        status:
          "open",

        evidence: [
          ...decisionEvidence.filter(
            (
              value,
            ): value is string =>
              typeof value ===
              "string",
          ),

          authorization.id,
        ],

        metadata: {
          actionId:
            action.id,

          delegationId:
            delegation.id,

          authorizationId:
            authorization.id,

          actorId,

          decisionId:
            action.metadata
              .decisionId,
        },
      });

    const consumedAuthorization =
      this.authorizationService
        .consume(
          authorization.id,
        );

    const runningAction =
      this.actionService
        .updateStatus(
          action.id,
          "running",
        );

    const inProgressDelegation =
      this.delegationService
        .updateStatus(
          delegation.id,
          "in-progress",
        );

    return {
      action:
        runningAction,

      delegation:
        inProgressDelegation,

      authorization:
        consumedAuthorization,

      audit,
    };
  }
}
