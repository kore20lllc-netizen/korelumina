export type ExecutiveComplianceStatus =
  | "pending"
  | "compliant"
  | "non-compliant"
  | "waived";

export interface ExecutiveCompliance {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly requirement: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveComplianceStatus;

  readonly evidence:
    readonly string[];

  readonly findings:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveComplianceInput {

  id: string;

  sessionId: string;

  title: string;

  requirement: string;

  ownerId: string;

  status?: ExecutiveComplianceStatus;

  evidence?: readonly string[];

  findings?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveCompliance(
  input:
    CreateExecutiveComplianceInput,
): ExecutiveCompliance {

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

    requirement:
      input.requirement.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "pending",

    evidence:
      Object.freeze([
        ...(input.evidence ??
          []),
      ]),

    findings:
      Object.freeze([
        ...(input.findings ??
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
