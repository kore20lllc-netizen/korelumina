export type ExecutiveBriefingStatus =
  | "draft"
  | "review"
  | "approved"
  | "archived";

export interface ExecutiveBriefing {
  readonly id: string;
  readonly sessionId: string;

  readonly title: string;
  readonly summary: string;

  readonly objectives:
    readonly string[];

  readonly risks:
    readonly string[];

  readonly recommendations:
    readonly string[];

  readonly status:
    ExecutiveBriefingStatus;

  readonly createdAt: number;
  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveBriefingInput {
  id: string;
  sessionId: string;
  title: string;
  summary: string;
  objectives?: readonly string[];
  risks?: readonly string[];
  recommendations?: readonly string[];
  status?: ExecutiveBriefingStatus;
  createdAt?: number;
  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveBriefing(
  input:
    CreateExecutiveBriefingInput,
): ExecutiveBriefing {

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

    objectives:
      Object.freeze([
        ...(input.objectives ??
          []),
      ]),

    risks:
      Object.freeze([
        ...(input.risks ??
          []),
      ]),

    recommendations:
      Object.freeze([
        ...(input.recommendations ??
          []),
      ]),

    status:
      input.status ??
      "draft",

    createdAt: now,
    updatedAt: now,

    metadata:
      Object.freeze({
        ...(input.metadata ??
          {}),
      }),
  });
}
