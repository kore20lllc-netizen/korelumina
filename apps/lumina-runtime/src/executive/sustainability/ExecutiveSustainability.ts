export type ExecutiveSustainabilityStatus =
  | "planned"
  | "improving"
  | "sustainable"
  | "optimized"
  | "validated";

export interface ExecutiveSustainability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveSustainabilityStatus;

  readonly sustainabilityScore: number;

  readonly operationalHealth: number;

  readonly maintainabilityScore: number;

  readonly longevityScore: number;

  readonly sustainabilityInitiatives:
    readonly string[];

  readonly sustainabilityRisks:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<Record<string, unknown>>;
}

export interface CreateExecutiveSustainabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  sustainabilityScore?: number;

  operationalHealth?: number;

  maintainabilityScore?: number;

  longevityScore?: number;

  status?:
    ExecutiveSustainabilityStatus;

  sustainabilityInitiatives?:
    readonly string[];

  sustainabilityRisks?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<Record<string, unknown>>;
}

export function createExecutiveSustainability(
  input: CreateExecutiveSustainabilityInput,
): ExecutiveSustainability {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({

    id: input.id.trim(),

    sessionId: input.sessionId.trim(),

    title: input.title.trim(),

    ownerId: input.ownerId.trim(),

    status:
      input.status ??
      "planned",

    sustainabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.sustainabilityScore ??
            100,
        ),
      ),

    operationalHealth:
      Math.max(
        0,
        Math.min(
          100,
          input.operationalHealth ??
            100,
        ),
      ),

    maintainabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.maintainabilityScore ??
            100,
        ),
      ),

    longevityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.longevityScore ??
            100,
        ),
      ),

    sustainabilityInitiatives:
      Object.freeze([
        ...(input.sustainabilityInitiatives ?? []),
      ]),

    sustainabilityRisks:
      Object.freeze([
        ...(input.sustainabilityRisks ?? []),
      ]),

    createdAt: now,

    updatedAt: now,

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),
  });
}
