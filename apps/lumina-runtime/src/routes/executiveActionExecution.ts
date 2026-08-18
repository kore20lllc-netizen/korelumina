import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveActionExecutionDispatcher,
  ExecutiveActionExecutionOperation,
} from "../executive/action/index.js";

function readString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function parseOperation(
  value: unknown,
): ExecutiveActionExecutionOperation {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      "executive_execution_operation_required",
    );
  }

  const operation =
    value as
      Record<
        string,
        unknown
      >;

  /*
   * First live executor surface intentionally accepts
   * filesystem.read only. Other typed operations exist
   * in the domain but are not live-enabled.
   */
  if (
    operation.type !==
      "filesystem.read"
  ) {
    throw new Error(
      "executive_execution_operation_not_live_enabled",
    );
  }

  const path =
    readString(
      operation.path,
    );

  if (!path) {
    throw new Error(
      "executive_execution_operation_path_required",
    );
  }

  return {
    type:
      "filesystem.read",

    path,
  };
}

export function registerExecutiveActionExecutionRoute(
  app: Express,

  dispatcher:
    ExecutiveActionExecutionDispatcher,
): void {
  app.post(
    "/api/executive/actions/:id/execute-operation",
    async (
      req: Request,
      res: Response,
    ) => {
      const actionId =
        readString(
          req.params.id,
        );

      const actorId =
        readString(
          req.body?.actorId,
        );

      const authorizationId =
        readString(
          req.body?.authorizationId,
        );

      const startAuditId =
        readString(
          req.body?.startAuditId,
        );

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

      if (!actorId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_executor_actor_required",
        });
      }

      if (!authorizationId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_execution_authorization_id_required",
        });
      }

      if (!startAuditId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_execution_start_audit_id_required",
        });
      }

      let operation:
        ExecutiveActionExecutionOperation;

      try {
        operation =
          parseOperation(
            req.body?.operation,
          );
      } catch (error) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : "executive_execution_operation_invalid",
        });
      }

      try {
        const result =
          await dispatcher.dispatch({
            actionId,
            actorId,
            authorizationId,
            startAuditId,
            operation,
          });

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
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "executive_action_execution_failed";

        if (
          message ===
            "executive_action_not_found" ||
          message ===
            "executive_delegation_not_found" ||
          message ===
            "executive_execution_authorization_not_found" ||
          message ===
            "executive_execution_start_audit_not_found" ||
          message ===
            "project_filesystem_read_file_not_found"
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
            "executive_executor_actor_not_authorized"
        ) {
          return res.status(
            403,
          ).json({
            ok:
              false,

            error:
              message,
          });
        }

        if (
          message ===
            "executive_action_executor_operation_not_registered" ||
          message ===
            "executive_executor_policy_not_registered" ||
          message ===
            "executive_executor_capability_not_declared" ||
          message ===
            "executive_executor_capability_prohibited" ||
          message ===
            "executive_executor_scope_not_allowed" ||
          message ===
            "executive_executor_project_scope_required" ||
          message ===
            "executive_action_not_running_for_executor" ||
          message ===
            "executive_delegation_not_in_progress_for_executor" ||
          message ===
            "executive_executor_authorization_mismatch" ||
          message ===
            "executive_executor_authorization_not_consumed" ||
          message ===
            "executive_executor_start_audit_mismatch" ||
          message ===
            "project_filesystem_read_symlink_escape_detected" ||
          message ===
            "project_filesystem_read_path_escape_detected" ||
          message ===
            "project_filesystem_read_target_not_file" ||
          message ===
            "project_filesystem_read_size_limit_exceeded"
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

        console.error(
          "[executive/action/execute-operation]",
          error,
        );

        return res.status(
          500,
        ).json({
          ok:
            false,

          error:
            "executive_action_execution_failed",
        });
      }
    },
  );
}
