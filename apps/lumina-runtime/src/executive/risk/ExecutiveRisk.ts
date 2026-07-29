export type ExecutiveRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ExecutiveRiskStatus =
  | "identified"
  | "mitigating"
  | "accepted"
  | "resolved";

export interface ExecutiveRisk {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly level:
    ExecutiveRiskLevel;

  readonly status:
    ExecutiveRiskStatus;

  readonly mitigationPlan:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveRiskInput {

  id: string;

  sessionId: string;

  title: string;

  description: string;

  ownerId: string;

  level?: ExecutiveRiskLevel;

  status?: ExecutiveRiskStatus;

  mitigationPlan?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveRisk(
  input:
    CreateExecutiveRiskInput,
): ExecutiveRisk {

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

    ownerId:
      input.ownerId.trim(),

    level:
      input.level ??
      "medium",

    status:
      input.status ??
      "identified",

    mitigationPlan:
      Object.freeze([
        ...(input.mitigationPlan ??
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
