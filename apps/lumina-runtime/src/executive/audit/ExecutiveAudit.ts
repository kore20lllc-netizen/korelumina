export type ExecutiveAuditSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type ExecutiveAuditStatus =
  | "open"
  | "reviewing"
  | "resolved"
  | "closed";

export interface ExecutiveAudit {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly description: string;

  readonly source: string;

  readonly ownerId: string;

  readonly severity:
    ExecutiveAuditSeverity;

  readonly status:
    ExecutiveAuditStatus;

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

export interface CreateExecutiveAuditInput {

  id: string;

  sessionId: string;

  title: string;

  description: string;

  source: string;

  ownerId: string;

  severity?: ExecutiveAuditSeverity;

  status?: ExecutiveAuditStatus;

  evidence?: readonly string[];

  recommendations?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAudit(
  input:
    CreateExecutiveAuditInput,
): ExecutiveAudit {

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

    description:
      input.description.trim(),

    source:
      input.source.trim(),

    ownerId:
      input.ownerId.trim(),

    severity:
      input.severity ??
      "info",

    status:
      input.status ??
      "open",

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
