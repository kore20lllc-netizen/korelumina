export type ExecutiveDecisionStatus =
  | "proposed"
  | "under-review"
  | "approved"
  | "rejected"
  | "implemented";

export interface ExecutiveDecision {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly rationale: string;

  readonly requestedBy: string;

  readonly approvedBy?: string;

  readonly status:
    ExecutiveDecisionStatus;

  readonly evidence:
    readonly string[];

  readonly consequences:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveDecisionInput {

  id: string;

  sessionId: string;

  title: string;

  rationale: string;

  requestedBy: string;

  approvedBy?: string;

  status?: ExecutiveDecisionStatus;

  evidence?: readonly string[];

  consequences?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveDecision(
  input:
    CreateExecutiveDecisionInput,
): ExecutiveDecision {

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

    rationale:
      input.rationale.trim(),

    requestedBy:
      input.requestedBy.trim(),

    approvedBy:
      input.approvedBy,

    status:
      input.status ??
      "proposed",

    evidence:
      Object.freeze([
        ...(input.evidence ??
          []),
      ]),

    consequences:
      Object.freeze([
        ...(input.consequences ??
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
