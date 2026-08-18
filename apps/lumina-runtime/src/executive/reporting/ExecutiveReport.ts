export type ExecutiveReportStatus =
  | "draft"
  | "review"
  | "published"
  | "archived";

export interface ExecutiveReport {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly summary: string;

  readonly authorId: string;

  readonly status:
    ExecutiveReportStatus;

  readonly sections:
    readonly string[];

  readonly recipients:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveReportInput {

  id: string;

  sessionId: string;

  title: string;

  summary: string;

  authorId: string;

  status?: ExecutiveReportStatus;

  sections?: readonly string[];

  recipients?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveReport(
  input:
    CreateExecutiveReportInput,
): ExecutiveReport {

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

    authorId:
      input.authorId.trim(),

    status:
      input.status ??
      "draft",

    sections:
      Object.freeze([
        ...(input.sections ??
          []),
      ]),

    recipients:
      Object.freeze([
        ...(input.recipients ??
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
