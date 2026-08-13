import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveActionExecutionDispatcher,
} from "../executive/action/index.js";

import {
  mapExecutiveActionMutationError,
  parseExecutiveActionReplacementRequest,
} from "./executiveActionMutationContract.js";

export interface ExecutiveActionMutationRouteOptions {
  readonly enabled:
    boolean;
}

export function registerExecutiveActionMutationRoute(
  app:
    Express,

  dispatcher:
    ExecutiveActionExecutionDispatcher,

  options:
    ExecutiveActionMutationRouteOptions,
): void {
  app.post(
    "/api/executive/actions/:id/execute-mutation",
    async (
      req:
        Request,

      res:
        Response,
    ) => {
      /*
       * Route registration is not equivalent to capability
       * activation. Mutation remains unavailable unless this
       * explicit runtime gate is enabled.
       */
      if (!options.enabled) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "executive_action_mutation_not_enabled",
        });
      }

      const actionId =
        typeof req.params.id ===
          "string"
          ? req.params.id.trim()
          : "";

      if (!actionId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_action_id_required",
        });
      }

      let request:
        ReturnType<
          typeof parseExecutiveActionReplacementRequest
        >;

      try {
        request =
          parseExecutiveActionReplacementRequest(
            req.body,
          );
      } catch (error) {
        const mapped =
          mapExecutiveActionMutationError(
            error,
          );

        return res.status(
          mapped.status,
        ).json({
          ok:
            false,

          error:
            mapped.error,
        });
      }

      try {
        const result =
          await dispatcher.dispatch({
            actionId,

            actorId:
              request.actorId,

            authorizationId:
              request.authorizationId,

            startAuditId:
              request.startAuditId,

            operation:
              request.operation,
          });

        /*
         * A mutation executor must produce compensation
         * material before its result can cross this route.
         */
        if (
          !result.executionResult.ok ||
          result.executionResult.metadata
            .compensationRequired !==
            true ||
          !result.executionResult.metadata
            .compensationSnapshot
        ) {
          return res.status(
            500,
          ).json({
            ok:
              false,

            error:
              "executive_mutation_compensation_evidence_missing",
          });
        }

        return res.json({
          ok:
            true,

          action:
            result.action,

          delegation:
            result.delegation,

          audit:
            result.audit,

          executionResult:
            result.executionResult,

          compensation: {
            required:
              true,

            plan:
              request.compensation.plan,

            snapshot:
              result.executionResult
                .metadata
                .compensationSnapshot,

            afterSha256:
              result.executionResult
                .metadata
                .afterSha256,
          },
        });
      } catch (error) {
        const mapped =
          mapExecutiveActionMutationError(
            error,
          );

        return res.status(
          mapped.status,
        ).json({
          ok:
            false,

          error:
            mapped.error,
        });
      }
    },
  );
}
