import type {
  ExecutiveExecutorCapability,
  ExecutiveExecutorScope,
} from "./ExecutiveActionExecutorPolicy.js";

export type ExecutiveActionExecutionOperation =
  | {
      readonly type:
        "filesystem.read";

      readonly path:
        string;
    }
  | {
      readonly type:
        "filesystem.write";

      readonly path:
        string;

      readonly content:
        string;
    }
  | {
      readonly type:
        "filesystem.delete";

      readonly path:
        string;
    }
  | {
      readonly type:
        "git.read";

      readonly command:
        "status" |
        "diff" |
        "log";
    }
  | {
      readonly type:
        "git.write";

      readonly command:
        "add" |
        "commit" |
        "push";
    }
  | {
      readonly type:
        "runtime.start";
    }
  | {
      readonly type:
        "runtime.stop";
    }
  | {
      readonly type:
        "runtime.restart";
    }
  | {
      readonly type:
        "network.request";

      readonly url:
        string;

      readonly method:
        "GET" |
        "POST" |
        "PUT" |
        "PATCH" |
        "DELETE";
    }
  | {
      readonly type:
        "deployment.read";
    }
  | {
      readonly type:
        "deployment.write";
    };

export interface ExecutiveActionExecutionOperationPolicy {
  readonly capability:
    ExecutiveExecutorCapability;

  readonly scope:
    ExecutiveExecutorScope;
}

const OPERATION_POLICY:
  Readonly<
    Record<
      ExecutiveActionExecutionOperation["type"],
      ExecutiveActionExecutionOperationPolicy
    >
  > =
    Object.freeze({
      "filesystem.read":
        Object.freeze({
          capability:
            "filesystem:read",

          scope:
            "project",
        }),

      "filesystem.write":
        Object.freeze({
          capability:
            "filesystem:write",

          scope:
            "project",
        }),

      "filesystem.delete":
        Object.freeze({
          capability:
            "filesystem:delete",

          scope:
            "project",
        }),

      "git.read":
        Object.freeze({
          capability:
            "git:read",

          scope:
            "project",
        }),

      "git.write":
        Object.freeze({
          capability:
            "git:write",

          scope:
            "project",
        }),

      "runtime.start":
        Object.freeze({
          capability:
            "runtime:start",

          scope:
            "project",
        }),

      "runtime.stop":
        Object.freeze({
          capability:
            "runtime:stop",

          scope:
            "project",
        }),

      "runtime.restart":
        Object.freeze({
          capability:
            "runtime:restart",

          scope:
            "project",
        }),

      "network.request":
        Object.freeze({
          capability:
            "network:request",

          scope:
            "project",
        }),

      "deployment.read":
        Object.freeze({
          capability:
            "deployment:read",

          scope:
            "project",
        }),

      "deployment.write":
        Object.freeze({
          capability:
            "deployment:write",

          scope:
            "project",
        }),
    });

export function resolveExecutiveActionExecutionOperationPolicy(
  operation:
    ExecutiveActionExecutionOperation,
): ExecutiveActionExecutionOperationPolicy {
  return OPERATION_POLICY[
    operation.type
  ];
}

export function validateExecutiveActionExecutionOperation(
  operation:
    ExecutiveActionExecutionOperation,
): void {
  if (
    operation.type ===
      "filesystem.read" ||
    operation.type ===
      "filesystem.write" ||
    operation.type ===
      "filesystem.delete"
  ) {
    const path =
      operation.path.trim();

    if (!path) {
      throw new Error(
        "executive_execution_operation_path_required",
      );
    }

    if (
      path.startsWith("/") ||
      path.includes("..")
    ) {
      throw new Error(
        "executive_execution_operation_path_outside_project",
      );
    }
  }

  if (
    operation.type ===
      "network.request"
  ) {
    const url =
      operation.url.trim();

    if (!url) {
      throw new Error(
        "executive_execution_operation_url_required",
      );
    }

    let parsed:
      URL;

    try {
      parsed =
        new URL(
          url,
        );
    } catch {
      throw new Error(
        "executive_execution_operation_url_invalid",
      );
    }

    if (
      parsed.protocol !==
        "https:"
    ) {
      throw new Error(
        "executive_execution_operation_https_required",
      );
    }
  }

  if (
    operation.type ===
      "filesystem.write" &&
    typeof operation.content !==
      "string"
  ) {
    throw new Error(
      "executive_execution_operation_content_required",
    );
  }
}
