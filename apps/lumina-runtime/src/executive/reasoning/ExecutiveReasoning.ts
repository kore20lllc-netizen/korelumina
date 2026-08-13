export type ExecutiveReasoningDisposition =
  | "authorize"
  | "review"
  | "deny";

export type ExecutiveReasoningStatus =
  | "pending"
  | "analyzing"
  | "completed"
  | "superseded";

export interface ExecutiveReasoning {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly question: string;

  readonly conclusion: string;

  readonly disposition:
    ExecutiveReasoningDisposition;

  readonly confidence: number;

  readonly evidence:
    readonly string[];

  readonly assumptions:
    readonly string[];

  readonly status:
    ExecutiveReasoningStatus;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveReasoningInput {

  id: string;

  sessionId: string;

  title: string;

  question: string;

  conclusion: string;

  disposition:
    ExecutiveReasoningDisposition;

  confidence: number;

  evidence?: readonly string[];

  assumptions?: readonly string[];

  status?: ExecutiveReasoningStatus;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveReasoning(
  input:
    CreateExecutiveReasoningInput,
): ExecutiveReasoning {

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

    question:
      input.question.trim(),

    conclusion:
      input.conclusion.trim(),

    disposition:
      input.disposition,

    confidence:
      Math.min(
        1,
        Math.max(
          0,
          input.confidence,
        ),
      ),

    evidence:
      Object.freeze([
        ...(input.evidence ??
          []),
      ]),

    assumptions:
      Object.freeze([
        ...(input.assumptions ??
          []),
      ]),

    status:
      input.status ??
      "pending",

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
