import type {
  ExecutiveDelegation,
} from "../delegation/index.js";

import type {
  ExecutiveAction,
} from "./ExecutiveAction.js";

import {
  createExecutiveActionExecutionAuthorization,
  type ExecutiveActionExecutionAuthorization,
} from "./ExecutiveActionExecutionAuthorization.js";

export interface AuthorizeExecutiveActionExecutionInput {
  action:
    ExecutiveAction;

  delegation:
    ExecutiveDelegation;

  actorId:
    string;

  authorizationId?:
    string;
}

export class ExecutiveActionExecutionAuthorizationService {
  private readonly authorizations =
    new Map<
      string,
      ExecutiveActionExecutionAuthorization
    >();

  authorize(
    input:
      AuthorizeExecutiveActionExecutionInput,
  ): ExecutiveActionExecutionAuthorization {
    const {
      action,
      delegation,
    } =
      input;

    if (
      action.status !==
      "ready"
    ) {
      throw new Error(
        "executive_action_not_ready_for_execution_authorization",
      );
    }

    if (
      delegation.status !==
      "accepted"
    ) {
      throw new Error(
        "executive_delegation_not_accepted_for_execution_authorization",
      );
    }

    if (
      action.delegationId !==
      delegation.id
    ) {
      throw new Error(
        "executive_execution_authorization_delegation_mismatch",
      );
    }

    if (
      action.ownerId !==
      delegation.assignedTo
    ) {
      throw new Error(
        "executive_execution_authorization_owner_mismatch",
      );
    }

    const actorId =
      input.actorId.trim();

    if (
      actorId.length ===
      0
    ) {
      throw new Error(
        "executive_execution_authorizer_required",
      );
    }

    if (
      actorId !==
      action.ownerId
    ) {
      throw new Error(
        "executive_execution_authorizer_not_authorized",
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
        "executive_execution_authorization_evidence_required",
      );
    }

    const authorizationId =
      (
        input.authorizationId ??
        `execution-authorization:${action.id}`
      ).trim();

    if (
      authorizationId.length ===
      0
    ) {
      throw new Error(
        "executive_execution_authorization_id_required",
      );
    }

    if (
      this.authorizations.has(
        authorizationId,
      )
    ) {
      throw new Error(
        "executive_execution_authorization_already_exists",
      );
    }

    const actionAuthorization =
      Array.from(
        this.authorizations.values(),
      ).find(
        (authorization) =>
          authorization.actionId ===
          action.id,
      );

    if (
      actionAuthorization
    ) {
      throw new Error(
        "executive_action_already_execution_authorized",
      );
    }

    const authorization =
      createExecutiveActionExecutionAuthorization({
        id:
          authorizationId,

        actionId:
          action.id,

        delegationId:
          delegation.id,

        actorId,

        metadata: {
          decisionId:
            action.metadata
              .decisionId,

          decisionEvidence: [
            ...decisionEvidence,
          ],

          ownerId:
            action.ownerId,
        },
      });

    this.authorizations.set(
      authorization.id,
      authorization,
    );

    return authorization;
  }

  consume(
    authorizationId: string,
  ): ExecutiveActionExecutionAuthorization {
    const authorization =
      this.authorizations.get(
        authorizationId,
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

    const consumed =
      Object.freeze({
        ...authorization,

        consumedAt:
          Date.now(),
      });

    this.authorizations.set(
      authorization.id,
      consumed,
    );

    return consumed;
  }

  get(
    id: string,
  ):
    | ExecutiveActionExecutionAuthorization
    | undefined {
    return this.authorizations.get(
      id,
    );
  }

  getForAction(
    actionId: string,
  ):
    | ExecutiveActionExecutionAuthorization
    | undefined {
    return Array.from(
      this.authorizations.values(),
    ).find(
      (authorization) =>
        authorization.actionId ===
        actionId,
    );
  }

  list():
    readonly ExecutiveActionExecutionAuthorization[] {
    return Object.freeze(
      Array.from(
        this.authorizations.values(),
      ),
    );
  }

  clear(): void {
    this.authorizations.clear();
  }
}
