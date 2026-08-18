export type ExecutivePolicyStatus =
  | "draft"
  | "approved"
  | "active"
  | "superseded"
  | "retired";

export interface ExecutivePolicy {

  readonly id: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly version: string;

  readonly status:
    ExecutivePolicyStatus;

  readonly rules:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutivePolicyInput {

  id: string;

  title: string;

  description: string;

  ownerId: string;

  version?: string;

  status?: ExecutivePolicyStatus;

  rules?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutivePolicy(
  input:
    CreateExecutivePolicyInput,
): ExecutivePolicy {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    title:
      input.title.trim(),

    description:
      input.description.trim(),

    ownerId:
      input.ownerId.trim(),

    version:
      input.version ??
      "1.0.0",

    status:
      input.status ??
      "draft",

    rules:
      Object.freeze([
        ...(input.rules ??
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
