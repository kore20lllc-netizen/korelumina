export interface ExecutiveActionCompensationAuthorization {
  readonly id:
    string;

  readonly actionId:
    string;

  readonly failedAuditId:
    string;

  readonly actorId:
    string;

  readonly authorizedBy:
    string;

  readonly authorizedAt:
    number;

  readonly consumedAt?:
    number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveActionCompensationAuthorizationInput {
  id:
    string;

  actionId:
    string;

  failedAuditId:
    string;

  actorId:
    string;

  authorizedBy:
    string;

  authorizedAt?:
    number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function createExecutiveActionCompensationAuthorization(
  input:
    CreateExecutiveActionCompensationAuthorizationInput,
): ExecutiveActionCompensationAuthorization {
  return Object.freeze({
    id:
      input.id.trim(),

    actionId:
      input.actionId.trim(),

    failedAuditId:
      input.failedAuditId.trim(),

    actorId:
      input.actorId.trim(),

    authorizedBy:
      input.authorizedBy.trim(),

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
