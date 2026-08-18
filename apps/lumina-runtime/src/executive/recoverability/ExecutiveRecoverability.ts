export type ExecutiveRecoverabilityStatus =
  | "planned"
  | "recoverable"
  | "recovering"
  | "restored"
  | "validated";

export interface ExecutiveRecoverability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveRecoverabilityStatus;

  readonly recoverabilityScore: number;

  readonly recoveryTimeObjective: number;

  readonly recoveryPointObjective: number;

  readonly recoverySuccessRate: number;

  readonly recoveryPlans:
    readonly string[];

  readonly recoveryTests:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveRecoverabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  recoverabilityScore?: number;

  recoveryTimeObjective?: number;

  recoveryPointObjective?: number;

  recoverySuccessRate?: number;

  status?: ExecutiveRecoverabilityStatus;

  recoveryPlans?: readonly string[];

  recoveryTests?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveRecoverability(
  input:
    CreateExecutiveRecoverabilityInput,
): ExecutiveRecoverability {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    title:
      input.title.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "planned",

    recoverabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.recoverabilityScore ??
            100,
        ),
      ),

    recoveryTimeObjective:
      Math.max(
        0,
        input.recoveryTimeObjective ??
          4,
      ),

    recoveryPointObjective:
      Math.max(
        0,
        input.recoveryPointObjective ??
          1,
      ),

    recoverySuccessRate:
      Math.max(
        0,
        Math.min(
          100,
          input.recoverySuccessRate ??
            100,
        ),
      ),

    recoveryPlans:
      Object.freeze([
        ...(input.recoveryPlans ??
          []),
      ]),

    recoveryTests:
      Object.freeze([
        ...(input.recoveryTests ??
          []),
      ]),

    createdAt:
      now,

    updatedAt:
      now,

    metadata:
      Object.freeze({
        ...(input.metadata ??
          {}),
      }),
  });
}
