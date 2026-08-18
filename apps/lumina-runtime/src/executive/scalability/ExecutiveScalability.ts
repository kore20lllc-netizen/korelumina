export type ExecutiveScalabilityStatus =
  | "planned"
  | "scaling"
  | "scalable"
  | "optimized"
  | "validated";

export interface ExecutiveScalability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveScalabilityStatus;

  readonly scalabilityScore: number;

  readonly capacityScore: number;

  readonly elasticityScore: number;

  readonly growthReadinessScore: number;

  readonly scalingStrategies:
    readonly string[];

  readonly scalingConstraints:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<Record<string, unknown>>;
}

export interface CreateExecutiveScalabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  scalabilityScore?: number;

  capacityScore?: number;

  elasticityScore?: number;

  growthReadinessScore?: number;

  status?:
    ExecutiveScalabilityStatus;

  scalingStrategies?:
    readonly string[];

  scalingConstraints?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<Record<string, unknown>>;
}

export function createExecutiveScalability(
  input: CreateExecutiveScalabilityInput,
): ExecutiveScalability {

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

    scalabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.scalabilityScore ??
            100,
        ),
      ),

    capacityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.capacityScore ??
            100,
        ),
      ),

    elasticityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.elasticityScore ??
            100,
        ),
      ),

    growthReadinessScore:
      Math.max(
        0,
        Math.min(
          100,
          input.growthReadinessScore ??
            100,
        ),
      ),

    scalingStrategies:
      Object.freeze([
        ...(input.scalingStrategies ?? []),
      ]),

    scalingConstraints:
      Object.freeze([
        ...(input.scalingConstraints ?? []),
      ]),

    createdAt:
      now,

    updatedAt:
      now,

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),
  });
}
