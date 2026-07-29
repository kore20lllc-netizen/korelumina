export type ExecutiveIntelligenceConfidence =
  | "low"
  | "medium"
  | "high"
  | "verified";

export interface ExecutiveIntelligence {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly summary: string;

  readonly source: string;

  readonly analystId: string;

  readonly confidence:
    ExecutiveIntelligenceConfidence;

  readonly evidence:
    readonly string[];

  readonly recommendations:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveIntelligenceInput {

  id: string;

  sessionId: string;

  title: string;

  summary: string;

  source: string;

  analystId: string;

  confidence?:
    ExecutiveIntelligenceConfidence;

  evidence?: readonly string[];

  recommendations?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveIntelligence(
  input:
    CreateExecutiveIntelligenceInput,
): ExecutiveIntelligence {

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

    summary:
      input.summary.trim(),

    source:
      input.source.trim(),

    analystId:
      input.analystId.trim(),

    confidence:
      input.confidence ??
      "medium",

    evidence:
      Object.freeze([
        ...(input.evidence ??
          []),
      ]),

    recommendations:
      Object.freeze([
        ...(input.recommendations ??
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
