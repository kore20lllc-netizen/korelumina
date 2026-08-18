export type ExecutiveAdaptabilityStatus =
  | "planned"
  | "adapting"
  | "adaptive"
  | "optimized"
  | "validated";

export interface ExecutiveAdaptability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAdaptabilityStatus;

  readonly adaptabilityScore: number;

  readonly responsivenessScore: number;

  readonly flexibilityScore: number;

  readonly resilienceScore: number;

  readonly adaptationStrategies:
    readonly string[];

  readonly adaptationTriggers:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAdaptabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  adaptabilityScore?: number;

  responsivenessScore?: number;

  flexibilityScore?: number;

  resilienceScore?: number;

  status?: ExecutiveAdaptabilityStatus;

  adaptationStrategies?:
    readonly string[];

  adaptationTriggers?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function createExecutiveAdaptability(
  input:
    CreateExecutiveAdaptabilityInput,
): ExecutiveAdaptability {

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

    adaptabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.adaptabilityScore ??
            100,
        ),
      ),

    responsivenessScore:
      Math.max(
        0,
        Math.min(
          100,
          input.responsivenessScore ??
            100,
        ),
      ),

    flexibilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.flexibilityScore ??
            100,
        ),
      ),

    resilienceScore:
      Math.max(
        0,
        Math.min(
          100,
          input.resilienceScore ??
            100,
        ),
      ),

    adaptationStrategies:
      Object.freeze([
        ...(input.adaptationStrategies ??
          []),
      ]),

    adaptationTriggers:
      Object.freeze([
        ...(input.adaptationTriggers ??
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
