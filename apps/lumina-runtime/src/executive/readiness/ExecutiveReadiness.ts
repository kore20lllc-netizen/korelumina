export type ExecutiveReadinessStatus =
  | "not-ready"
  | "preparing"
  | "ready"
  | "validated"
  | "operational";

export interface ExecutiveReadiness {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveReadinessStatus;

  readonly readinessScore: number;

  readonly targetScore: number;

  readonly capabilities:
    readonly string[];

  readonly blockers:
    readonly string[];

  readonly validations:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveReadinessInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  readinessScore?: number;

  targetScore?: number;

  status?: ExecutiveReadinessStatus;

  capabilities?: readonly string[];

  blockers?: readonly string[];

  validations?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveReadiness(
  input:
    CreateExecutiveReadinessInput,
): ExecutiveReadiness {

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
      "not-ready",

    readinessScore:
      Math.max(
        0,
        Math.min(
          100,
          input.readinessScore ??
            0,
        ),
      ),

    targetScore:
      Math.max(
        0,
        Math.min(
          100,
          input.targetScore ??
            100,
        ),
      ),

    capabilities:
      Object.freeze([
        ...(input.capabilities ??
          []),
      ]),

    blockers:
      Object.freeze([
        ...(input.blockers ??
          []),
      ]),

    validations:
      Object.freeze([
        ...(input.validations ??
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
