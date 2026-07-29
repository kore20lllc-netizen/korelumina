export type ExecutiveTrustworthinessStatus =
  | "planned"
  | "trusted"
  | "evaluating"
  | "optimized"
  | "validated";

export interface ExecutiveTrustworthiness {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveTrustworthinessStatus;

  readonly trustworthinessScore: number;

  readonly integrityScore: number;

  readonly credibilityScore: number;

  readonly consistencyScore: number;

  readonly trustEvidence:
    readonly string[];

  readonly verificationSources:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveTrustworthinessInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  trustworthinessScore?: number;

  integrityScore?: number;

  credibilityScore?: number;

  consistencyScore?: number;

  status?: ExecutiveTrustworthinessStatus;

  trustEvidence?: readonly string[];

  verificationSources?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveTrustworthiness(
  input:
    CreateExecutiveTrustworthinessInput,
): ExecutiveTrustworthiness {

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

    trustworthinessScore:
      Math.max(
        0,
        Math.min(
          100,
          input.trustworthinessScore ??
            100,
        ),
      ),

    integrityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.integrityScore ??
            100,
        ),
      ),

    credibilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.credibilityScore ??
            100,
        ),
      ),

    consistencyScore:
      Math.max(
        0,
        Math.min(
          100,
          input.consistencyScore ??
            100,
        ),
      ),

    trustEvidence:
      Object.freeze([
        ...(input.trustEvidence ??
          []),
      ]),

    verificationSources:
      Object.freeze([
        ...(input.verificationSources ??
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
