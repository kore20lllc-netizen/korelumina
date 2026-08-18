export type ExecutiveBenefitStatus =
  | "identified"
  | "planned"
  | "realizing"
  | "realized"
  | "retired";

export interface ExecutiveBenefit {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveBenefitStatus;

  readonly expectedValue: number;

  readonly realizedValue: number;

  readonly beneficiaries:
    readonly string[];

  readonly successMeasures:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveBenefitInput {

  id: string;

  sessionId: string;

  title: string;

  description: string;

  ownerId: string;

  expectedValue?: number;

  realizedValue?: number;

  status?: ExecutiveBenefitStatus;

  beneficiaries?: readonly string[];

  successMeasures?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveBenefit(
  input:
    CreateExecutiveBenefitInput,
): ExecutiveBenefit {

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

    status:
      input.status ??
      "identified",

    expectedValue:
      input.expectedValue ??
      0,

    realizedValue:
      input.realizedValue ??
      0,

    beneficiaries:
      Object.freeze([
        ...(input.beneficiaries ??
          []),
      ]),

    successMeasures:
      Object.freeze([
        ...(input.successMeasures ??
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
