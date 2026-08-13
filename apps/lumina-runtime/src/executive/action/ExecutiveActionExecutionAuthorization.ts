export interface ExecutiveActionExecutionAuthorization {
  readonly id: string;

  readonly actionId: string;

  readonly delegationId: string;

  readonly actorId: string;

  readonly authorizedAt: number;

  readonly consumedAt?: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveActionExecutionAuthorizationInput {
  id: string;

  actionId: string;

  delegationId: string;

  actorId: string;

  authorizedAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveActionExecutionAuthorization(
  input:
    CreateExecutiveActionExecutionAuthorizationInput,
): ExecutiveActionExecutionAuthorization {
  return Object.freeze({
    id:
      input.id.trim(),

    actionId:
      input.actionId.trim(),

    delegationId:
      input.delegationId.trim(),

    actorId:
      input.actorId.trim(),

    authorizedAt:
      input.authorizedAt ??
      Date.now(),

    consumedAt:
      undefined,

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),
  });
}
