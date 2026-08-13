import type {
  ExecutiveAction,
} from "./ExecutiveAction.js";

export interface ExecutiveActionExecutionContext {
  readonly action:
    ExecutiveAction;

  readonly actorId:
    string;

  readonly startAuditId:
    string;

  readonly authorizationId:
    string;
}

export interface ExecutiveActionExecutionSuccess {
  readonly ok:
    true;

  readonly summary:
    string;

  readonly evidence:
    readonly string[];

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface ExecutiveActionExecutionFailure {
  readonly ok:
    false;

  readonly reason:
    string;

  readonly evidence:
    readonly string[];

  readonly compensationRequired:
    boolean;

  readonly compensationPlan?:
    string;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export type ExecutiveActionExecutionResult =
  | ExecutiveActionExecutionSuccess
  | ExecutiveActionExecutionFailure;

export interface ExecutiveActionExecutor {
  readonly name:
    string;

  execute(
    context:
      ExecutiveActionExecutionContext,
  ):
    | Promise<
        ExecutiveActionExecutionResult
      >
    | ExecutiveActionExecutionResult;
}
