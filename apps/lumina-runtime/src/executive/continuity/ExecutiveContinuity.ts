export type ExecutiveContinuityStatus =
  | "planned"
  | "ready"
  | "active"
  | "recovering"
  | "restored";

export interface ExecutiveContinuity {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveContinuityStatus;

  readonly recoveryTimeObjective: number;

  readonly recoveryPointObjective: number;

  readonly readinessScore: number;

  readonly criticalServices:
    readonly string[];

  readonly dependencies:
    readonly string[];

  readonly recoveryProcedures:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveContinuityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  recoveryTimeObjective?: number;

  recoveryPointObjective?: number;

  readinessScore?: number;

  status?: ExecutiveContinuityStatus;

  criticalServices?: readonly string[];

  dependencies?: readonly string[];

  recoveryProcedures?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveContinuity(
  input:
    CreateExecutiveContinuityInput,
): ExecutiveContinuity {

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

    recoveryTimeObjective:
      input.recoveryTimeObjective ??
      4,

    recoveryPointObjective:
      input.recoveryPointObjective ??
      1,

    readinessScore:
      Math.max(
        0,
        Math.min(
          100,
          input.readinessScore ??
            100,
        ),
      ),

    criticalServices:
      Object.freeze([
        ...(input.criticalServices ??
          []),
      ]),

    dependencies:
      Object.freeze([
        ...(input.dependencies ??
          []),
      ]),

    recoveryProcedures:
      Object.freeze([
        ...(input.recoveryProcedures ??
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
