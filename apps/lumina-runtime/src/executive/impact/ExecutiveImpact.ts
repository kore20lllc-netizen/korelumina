export type ExecutiveImpactStatus =
  | "identified"
  | "forecasted"
  | "validated"
  | "realized";

export interface ExecutiveImpact {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveImpactStatus;

  readonly category: string;

  readonly magnitude: number;

  readonly confidence: number;

  readonly affectedDomains:
    readonly string[];

  readonly evidence:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveImpactInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  category: string;

  magnitude: number;

  confidence?: number;

  status?: ExecutiveImpactStatus;

  affectedDomains?: readonly string[];

  evidence?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveImpact(
  input:
    CreateExecutiveImpactInput,
): ExecutiveImpact {

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
      "identified",

    category:
      input.category.trim(),

    magnitude:
      input.magnitude,

    confidence:
      Math.max(
        0,
        Math.min(
          100,
          input.confidence ??
            100,
        ),
      ),

    affectedDomains:
      Object.freeze([
        ...(input.affectedDomains ??
          []),
      ]),

    evidence:
      Object.freeze([
        ...(input.evidence ??
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
