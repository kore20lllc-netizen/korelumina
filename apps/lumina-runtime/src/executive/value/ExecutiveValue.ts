export type ExecutiveValueStatus =
  | "projected"
  | "realizing"
  | "realized"
  | "declining";

export interface ExecutiveValue {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveValueStatus;

  readonly expectedValue: number;

  readonly realizedValue: number;

  readonly currency: string;

  readonly drivers:
    readonly string[];

  readonly beneficiaries:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveValueInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  expectedValue: number;

  realizedValue?: number;

  currency?: string;

  status?: ExecutiveValueStatus;

  drivers?: readonly string[];

  beneficiaries?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveValue(
  input:
    CreateExecutiveValueInput,
): ExecutiveValue {

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
      "projected",

    expectedValue:
      input.expectedValue,

    realizedValue:
      input.realizedValue ??
      0,

    currency:
      input.currency ??
      "USD",

    drivers:
      Object.freeze([
        ...(input.drivers ??
          []),
      ]),

    beneficiaries:
      Object.freeze([
        ...(input.beneficiaries ??
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
