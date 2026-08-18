export type ExecutiveTransformationStatus =
  | "planned"
  | "transforming"
  | "transformed"
  | "sustained"
  | "validated";

export interface ExecutiveTransformation {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveTransformationStatus;

  readonly transformationScore: number;

  readonly changeReadiness: number;

  readonly adoptionScore: number;

  readonly innovationImpact: number;

  readonly transformationInitiatives:
    readonly string[];

  readonly transformationMilestones:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveTransformationInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  transformationScore?: number;

  changeReadiness?: number;

  adoptionScore?: number;

  innovationImpact?: number;

  status?: ExecutiveTransformationStatus;

  transformationInitiatives?: readonly string[];

  transformationMilestones?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveTransformation(
  input:
    CreateExecutiveTransformationInput,
): ExecutiveTransformation {

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

    transformationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.transformationScore ??
            100,
        ),
      ),

    changeReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.changeReadiness ??
            100,
        ),
      ),

    adoptionScore:
      Math.max(
        0,
        Math.min(
          100,
          input.adoptionScore ??
            100,
        ),
      ),

    innovationImpact:
      Math.max(
        0,
        Math.min(
          100,
          input.innovationImpact ??
            100,
        ),
      ),

    transformationInitiatives:
      Object.freeze([
        ...(input.transformationInitiatives ??
          []),
      ]),

    transformationMilestones:
      Object.freeze([
        ...(input.transformationMilestones ??
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
