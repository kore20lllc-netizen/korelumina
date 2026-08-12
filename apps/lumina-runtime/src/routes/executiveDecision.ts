import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveDelegationActionProposalService,
} from "../executive/action/index.js";

import type {
  ExecutiveDecisionService,
} from "../executive/decision/index.js";

import type {
  ExecutiveDecisionDelegationService,
} from "../executive/delegation/index.js";

export interface ExecutiveDecisionRouteDependencies {
  decisionService:
    ExecutiveDecisionService;

  decisionDelegationService:
    ExecutiveDecisionDelegationService;

  delegationActionProposalService:
    ExecutiveDelegationActionProposalService;
}

function readString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function respondDomainError(
  res: Response,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "executive_decision_delegation_failed";

  if (
    message ===
    "executive_decision_not_found"
  ) {
    return res.status(
      404,
    ).json({
      ok:
        false,

      error:
        message,
    });
  }

  if (
    message ===
      "executive_decision_not_approved" ||
    message ===
      "executive_decision_evidence_required_for_delegation" ||
    message ===
      "executive_delegation_not_assigned" ||
    message ===
      "executive_delegation_decision_mismatch"
  ) {
    return res.status(
      409,
    ).json({
      ok:
        false,

      error:
        message,
    });
  }

  if (
    message ===
      "executive_delegation_assigner_required" ||
    message ===
      "executive_delegation_assignee_required" ||
    message ===
      "executive_action_owner_required"
  ) {
    return res.status(
      400,
    ).json({
      ok:
        false,

      error:
        message,
    });
  }

  console.error(
    "[executive/decision/delegate]",
    error,
  );

  return res.status(
    500,
  ).json({
    ok:
      false,

    error:
      "executive_decision_delegation_failed",
  });
}

export function registerExecutiveDecisionRoute(
  app: Express,
  dependencies:
    ExecutiveDecisionRouteDependencies,
): void {
  const {
    decisionService,
    decisionDelegationService,
    delegationActionProposalService,
  } =
    dependencies;

  app.get(
    "/api/executive/decisions/:id",
    (
      req: Request,
      res: Response,
    ) => {
      const id =
        readString(
          req.params.id,
        );

      if (
        id.length === 0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_decision_id_required",
        });
      }

      const decision =
        decisionService.get(
          id,
        );

      if (
        !decision
      ) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "executive_decision_not_found",

          id,
        });
      }

      return res.json({
        ok:
          true,

        decision,
      });
    },
  );

  app.post(
    "/api/executive/decisions/:id/delegate",
    (
      req: Request,
      res: Response,
    ) => {
      const decisionId =
        readString(
          req.params.id,
        );

      const actorId =
        readString(
          req.body?.actorId,
        );

      const assignedTo =
        readString(
          req.body?.assignedTo,
        );

      if (
        decisionId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_decision_id_required",
        });
      }

      if (
        actorId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_delegation_assigner_required",
        });
      }

      if (
        assignedTo.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_delegation_assignee_required",
        });
      }

      const decision =
        decisionService.get(
          decisionId,
        );

      if (
        !decision
      ) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "executive_decision_not_found",

          id:
            decisionId,
        });
      }

      if (
        decision.status !==
        "approved"
      ) {
        return res.status(
          409,
        ).json({
          ok:
            false,

          error:
            "executive_decision_not_approved",
        });
      }

      if (
        decision.approvedBy !==
        actorId
      ) {
        return res.status(
          403,
        ).json({
          ok:
            false,

          error:
            "executive_delegation_actor_not_authorized",
        });
      }

      try {
        const delegation =
          decisionDelegationService
            .delegate({
              decision,

              assignedBy:
                actorId,

              assignedTo,

              priority:
                req.body?.priority,
            });

        const action =
          delegationActionProposalService
            .propose({
              decision,
              delegation,
            });

        return res.json({
          ok:
            true,

          decision,
          delegation,
          action,
        });
      } catch (error) {
        return respondDomainError(
          res,
          error,
        );
      }
    },
  );
}
