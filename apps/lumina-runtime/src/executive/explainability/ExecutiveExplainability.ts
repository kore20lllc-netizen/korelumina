export type ExecutiveExplainabilityStatus =
  | "planned"
  | "explainable"
  | "explaining"
  | "optimized"
  | "validated";

export interface ExecutiveExplainability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveExplainabilityStatus;

  readonly explainabilityScore: number;

  readonly transparencyScore: number;

  readonly interpretabilityScore: number;

  readonly documentationCoverage: number;

  readonly explanationArtifacts:
    readonly string[];

  readonly knowledgeReferences:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveExplainabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  explainabilityScore?: number;

  transparencyScore?: number;

  interpretabilityScore?: number;

  documentationCoverage?: number;

  status?: ExecutiveExplainabilityStatus;

  explanationArtifacts?: readonly string[];

  knowledgeReferences?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveExplainability(
  input:
    CreateExecutiveExplainabilityInput,
): ExecutiveExplainability {

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

    explainabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.explainabilityScore ??
            100,
        ),
      ),

    transparencyScore:
      Math.max(
        0,
        Math.min(
          100,
          input.transparencyScore ??
            100,
        ),
      ),

    interpretabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.interpretabilityScore ??
            100,
        ),
      ),

    documentationCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.documentationCoverage ??
            100,
        ),
      ),

    explanationArtifacts:
      Object.freeze([
        ...(input.explanationArtifacts ??
          []),
      ]),

    knowledgeReferences:
      Object.freeze([
        ...(input.knowledgeReferences ??
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
