export type ExecutiveEvolvabilityStatus =
  | "planned"
  | "evolving"
  | "adaptive"
  | "optimized"
  | "validated";

export interface ExecutiveEvolvability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveEvolvabilityStatus;

  readonly evolvabilityScore: number;

  readonly adaptabilityScore: number;

  readonly innovationCapacity: number;

  readonly architectureFlexibility: number;

  readonly evolutionGoals:
    readonly string[];

  readonly architecturalConstraints:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveEvolvabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  evolvabilityScore?: number;

  adaptabilityScore?: number;

  innovationCapacity?: number;

  architectureFlexibility?: number;

  status?: ExecutiveEvolvabilityStatus;

  evolutionGoals?: readonly string[];

  architecturalConstraints?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveEvolvability(
  input:
    CreateExecutiveEvolvabilityInput,
): ExecutiveEvolvability {

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

    evolvabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.evolvabilityScore ??
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

    innovationCapacity:
      Math.max(
        0,
        Math.min(
          100,
          input.innovationCapacity ??
            100,
        ),
      ),

    architectureFlexibility:
      Math.max(
        0,
        Math.min(
          100,
          input.architectureFlexibility ??
            100,
        ),
      ),

    evolutionGoals:
      Object.freeze([
        ...(input.evolutionGoals ??
          []),
      ]),

    architecturalConstraints:
      Object.freeze([
        ...(input.architecturalConstraints ??
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
