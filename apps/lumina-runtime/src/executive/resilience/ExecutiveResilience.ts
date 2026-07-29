export type ExecutiveResilienceStatus =
  | "planned"
  | "strengthening"
  | "resilient"
  | "optimized"
  | "validated";

export interface ExecutiveResilience {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveResilienceStatus;

  readonly resilienceScore: number;

  readonly recoveryCapability: number;

  readonly continuityScore: number;

  readonly adaptabilityScore: number;

  readonly resilienceStrategies:
    readonly string[];

  readonly resilienceRisks:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveResilienceInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  resilienceScore?: number;

  recoveryCapability?: number;

  continuityScore?: number;

  adaptabilityScore?: number;

  status?:
    ExecutiveResilienceStatus;

  resilienceStrategies?:
    readonly string[];

  resilienceRisks?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function createExecutiveResilience(
  input:
    CreateExecutiveResilienceInput,
): ExecutiveResilience {

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

    resilienceScore:
      Math.max(
        0,
        Math.min(
          100,
          input.resilienceScore ??
            100,
        ),
      ),

    recoveryCapability:
      Math.max(
        0,
        Math.min(
          100,
          input.recoveryCapability ??
            100,
        ),
      ),

    continuityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.continuityScore ??
            100,
        ),
      ),

    adaptabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.adaptabilityScore ??
            100,
        ),
      ),

    resilienceStrategies:
      Object.freeze([
        ...(input.resilienceStrategies ??
          []),
      ]),

    resilienceRisks:
      Object.freeze([
        ...(input.resilienceRisks ??
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
