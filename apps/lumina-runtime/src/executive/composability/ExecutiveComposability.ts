export type ExecutiveComposabilityStatus =
  | "planned"
  | "composable"
  | "assembling"
  | "optimized"
  | "validated";

export interface ExecutiveComposability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveComposabilityStatus;

  readonly composabilityScore: number;

  readonly reuseScore: number;

  readonly orchestrationScore: number;

  readonly compositionCoverage: number;

  readonly reusableComponents:
    readonly string[];

  readonly composedSolutions:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveComposabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  composabilityScore?: number;

  reuseScore?: number;

  orchestrationScore?: number;

  compositionCoverage?: number;

  status?: ExecutiveComposabilityStatus;

  reusableComponents?: readonly string[];

  composedSolutions?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveComposability(
  input:
    CreateExecutiveComposabilityInput,
): ExecutiveComposability {

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

    composabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.composabilityScore ??
            100,
        ),
      ),

    reuseScore:
      Math.max(
        0,
        Math.min(
          100,
          input.reuseScore ??
            100,
        ),
      ),

    orchestrationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.orchestrationScore ??
            100,
        ),
      ),

    compositionCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.compositionCoverage ??
            100,
        ),
      ),

    reusableComponents:
      Object.freeze([
        ...(input.reusableComponents ??
          []),
      ]),

    composedSolutions:
      Object.freeze([
        ...(input.composedSolutions ??
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
