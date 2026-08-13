import {
  ExecutiveAuditService,
  type ExecutiveAudit,
} from "../audit/index.js";

import {
  createExecutiveActionCompensationAuthorization,
  type ExecutiveActionCompensationAuthorization,
} from "./ExecutiveActionCompensationAuthorization.js";

export interface AuthorizeExecutiveActionCompensationInput {
  failedAuditId:
    string;

  actorId:
    string;

  authorizedBy:
    string;

  authorizationId?:
    string;
}

export class ExecutiveActionCompensationAuthorizationService {
  private readonly authorizations =
    new Map<
      string,
      ExecutiveActionCompensationAuthorization
    >();

  constructor(
    private readonly auditService:
      ExecutiveAuditService,
  ) {}

  authorize(
    input:
      AuthorizeExecutiveActionCompensationInput,
  ): ExecutiveActionCompensationAuthorization {
    const failedAuditId =
      input.failedAuditId.trim();

    const actorId =
      input.actorId.trim();

    const authorizedBy =
      input.authorizedBy.trim();

    if (!failedAuditId) {
      throw new Error(
        "executive_compensation_failed_audit_id_required",
      );
    }

    if (!actorId) {
      throw new Error(
        "executive_compensation_actor_required",
      );
    }

    if (!authorizedBy) {
      throw new Error(
        "executive_compensation_authorizer_required",
      );
    }

    const failedAudit =
      this.resolveFailedCompensationAudit(
        failedAuditId,
      );

    const actionId =
      typeof failedAudit.metadata
        .actionId ===
        "string"
        ? failedAudit.metadata
            .actionId
            .trim()
        : "";

    if (!actionId) {
      throw new Error(
        "executive_compensation_failed_audit_action_required",
      );
    }

    /*
     * Compensation execution remains assigned to the actor
     * who owns the failed execution audit. A separate actor
     * cannot be substituted during rollback authorization.
     */
    if (
      actorId !==
      failedAudit.ownerId
    ) {
      throw new Error(
        "executive_compensation_actor_not_authorized",
      );
    }

    const authorizationId =
      (
        input.authorizationId ??
        `compensation-authorization:${actionId}`
      ).trim();

    if (!authorizationId) {
      throw new Error(
        "executive_compensation_authorization_id_required",
      );
    }

    if (
      this.authorizations.has(
        authorizationId,
      )
    ) {
      throw new Error(
        "executive_compensation_authorization_already_exists",
      );
    }

    const existingForAction =
      Array.from(
        this.authorizations.values(),
      ).find(
        (authorization) =>
          authorization.actionId ===
          actionId,
      );

    if (existingForAction) {
      throw new Error(
        "executive_action_already_compensation_authorized",
      );
    }

    const authorization =
      createExecutiveActionCompensationAuthorization({
        id:
          authorizationId,

        actionId,

        failedAuditId:
          failedAudit.id,

        actorId,

        authorizedBy,

        metadata: {
          sessionId:
            failedAudit.sessionId,

          failedExecutionSource:
            failedAudit.source,

          compensationRequired:
            true,

          compensationStatus:
            "required",
        },
      });

    this.authorizations.set(
      authorization.id,
      authorization,
    );

    return authorization;
  }

  consume(
    authorizationId:
      string,
  ): ExecutiveActionCompensationAuthorization {
    const id =
      authorizationId.trim();

    if (!id) {
      throw new Error(
        "executive_compensation_authorization_id_required",
      );
    }

    const authorization =
      this.authorizations.get(
        id,
      );

    if (!authorization) {
      throw new Error(
        "executive_compensation_authorization_not_found",
      );
    }

    if (
      authorization.consumedAt !==
      undefined
    ) {
      throw new Error(
        "executive_compensation_authorization_already_consumed",
      );
    }

    /*
     * Re-resolve the failed audit when consuming so an
     * authorization cannot outlive its governance obligation.
     */
    const failedAudit =
      this.resolveFailedCompensationAudit(
        authorization.failedAuditId,
      );

    if (
      failedAudit.metadata.actionId !==
      authorization.actionId
    ) {
      throw new Error(
        "executive_compensation_authorization_action_mismatch",
      );
    }

    const consumed =
      Object.freeze({
        ...authorization,

        consumedAt:
          Date.now(),
      });

    this.authorizations.set(
      consumed.id,
      consumed,
    );

    return consumed;
  }

  get(
    id:
      string,
  ):
    | ExecutiveActionCompensationAuthorization
    | undefined {
    return this.authorizations.get(
      id,
    );
  }

  getForAction(
    actionId:
      string,
  ):
    | ExecutiveActionCompensationAuthorization
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
    readonly ExecutiveActionCompensationAuthorization[] {
    return Object.freeze(
      Array.from(
        this.authorizations.values(),
      ),
    );
  }

  clear():
    void {
    this.authorizations.clear();
  }

  private resolveFailedCompensationAudit(
    auditId:
      string,
  ): ExecutiveAudit {
    const audit =
      this.auditService.get(
        auditId,
      );

    if (!audit) {
      throw new Error(
        "executive_compensation_failed_audit_not_found",
      );
    }

    if (
      audit.source !==
      "executive-action-execution-failed"
    ) {
      throw new Error(
        "executive_compensation_failed_audit_invalid",
      );
    }

    if (
      audit.status !==
      "open"
    ) {
      throw new Error(
        "executive_compensation_obligation_not_open",
      );
    }

    if (
      audit.metadata
        .compensationRequired !==
        true ||
      audit.metadata
        .compensationStatus !==
        "required"
    ) {
      throw new Error(
        "executive_compensation_not_required",
      );
    }

    return audit;
  }
}
