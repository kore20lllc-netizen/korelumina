import type {
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

export interface ExecutiveActionReplacementRequest {
  readonly actorId:
    string;

  readonly authorizationId:
    string;

  readonly startAuditId:
    string;

  readonly operation:
    Extract<
      ExecutiveActionExecutionOperation,
      {
        readonly type:
          "filesystem.replace";
      }
    >;

  readonly compensation:
    {
      readonly required:
        true;

      readonly plan:
        string;
    };
}

export interface ExecutiveActionMutationErrorMapping {
  readonly status:
    400 | 403 | 404 | 409 | 500;

  readonly error:
    string;
}

export function parseExecutiveActionReplacementRequest(
  body: unknown,
): ExecutiveActionReplacementRequest {
  if (
    !body ||
    typeof body !==
      "object"
  ) {
    throw new Error(
      "executive_mutation_request_required",
    );
  }

  const input =
    body as
      Record<
        string,
        unknown
      >;

  const actorId =
    readString(
      input.actorId,
    );

  const authorizationId =
    readString(
      input.authorizationId,
    );

  const startAuditId =
    readString(
      input.startAuditId,
    );

  if (!actorId) {
    throw new Error(
      "executive_executor_actor_required",
    );
  }

  if (!authorizationId) {
    throw new Error(
      "executive_execution_authorization_id_required",
    );
  }

  if (!startAuditId) {
    throw new Error(
      "executive_execution_start_audit_id_required",
    );
  }

  if (
    !input.operation ||
    typeof input.operation !==
      "object"
  ) {
    throw new Error(
      "executive_execution_operation_required",
    );
  }

  const rawOperation =
    input.operation as
      Record<
        string,
        unknown
      >;

  if (
    rawOperation.type !==
      "filesystem.replace"
  ) {
    throw new Error(
      "executive_mutation_operation_not_supported",
    );
  }

  const path =
    readString(
      rawOperation.path,
    );

  const content =
    typeof rawOperation.content ===
      "string"
      ? rawOperation.content
      : undefined;

  const expectedSha256 =
    readString(
      rawOperation.expectedSha256,
    ).toLowerCase();

  if (!path) {
    throw new Error(
      "executive_execution_operation_path_required",
    );
  }

  if (
    content ===
    undefined
  ) {
    throw new Error(
      "executive_execution_operation_content_required",
    );
  }

  if (
    !/^[a-f0-9]{64}$/.test(
      expectedSha256,
    )
  ) {
    throw new Error(
      "executive_execution_operation_expected_sha256_invalid",
    );
  }

  if (
    !input.compensation ||
    typeof input.compensation !==
      "object"
  ) {
    throw new Error(
      "executive_mutation_compensation_contract_required",
    );
  }

  const rawCompensation =
    input.compensation as
      Record<
        string,
        unknown
      >;

  if (
    rawCompensation.required !==
    true
  ) {
    throw new Error(
      "executive_mutation_compensation_must_be_required",
    );
  }

  const plan =
    readString(
      rawCompensation.plan,
    );

  if (!plan) {
    throw new Error(
      "executive_mutation_compensation_plan_required",
    );
  }

  return Object.freeze({
    actorId,

    authorizationId,

    startAuditId,

    operation:
      Object.freeze({
        type:
          "filesystem.replace",

        path,

        content,

        expectedSha256,
      }),

    compensation:
      Object.freeze({
        required:
          true,

        plan,
      }),
  });
}

export function mapExecutiveActionMutationError(
  error:
    unknown,
): ExecutiveActionMutationErrorMapping {
  const message =
    error instanceof Error
      ? error.message
      : "executive_action_mutation_failed";

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
      "project_filesystem_replace_target_not_found"
  ) {
    return {
      status:
        404,

      error:
        message,
    };
  }

  if (
    message ===
      "executive_executor_actor_not_authorized"
  ) {
    return {
      status:
        403,

      error:
        message,
    };
  }

  if (
    message ===
      "executive_mutation_request_required" ||
    message ===
      "executive_executor_actor_required" ||
    message ===
      "executive_execution_authorization_id_required" ||
    message ===
      "executive_execution_start_audit_id_required" ||
    message ===
      "executive_execution_operation_required" ||
    message ===
      "executive_mutation_operation_not_supported" ||
    message ===
      "executive_execution_operation_path_required" ||
    message ===
      "executive_execution_operation_content_required" ||
    message ===
      "executive_execution_operation_expected_sha256_invalid" ||
    message ===
      "executive_mutation_compensation_contract_required" ||
    message ===
      "executive_mutation_compensation_must_be_required" ||
    message ===
      "executive_mutation_compensation_plan_required"
  ) {
    return {
      status:
        400,

      error:
        message,
    };
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
      "project_filesystem_replace_path_escape_detected" ||
    message ===
      "project_filesystem_replace_symlink_escape_detected" ||
    message ===
      "project_filesystem_replace_target_not_file" ||
    message ===
      "project_filesystem_replace_size_limit_exceeded" ||
    message ===
      "project_filesystem_replace_snapshot_size_limit_exceeded" ||
    message ===
      "project_filesystem_replace_precondition_failed" ||
    message ===
      "project_filesystem_replace_postcondition_failed"
  ) {
    return {
      status:
        409,

      error:
        message,
    };
  }

  return {
    status:
      500,

    error:
      "executive_action_mutation_failed",
  };
}
