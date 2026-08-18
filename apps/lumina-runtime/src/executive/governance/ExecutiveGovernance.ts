export type ExecutiveGovernanceStatus =
  | "draft"
  | "active"
  | "superseded"
  | "retired";

export interface ExecutiveGovernance {

  readonly id: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly policies:
    readonly string[];

  readonly authorities:
    readonly string[];

  readonly status:
    ExecutiveGovernanceStatus;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveGovernanceInput {

  id: string;

  title: string;

  description: string;

  ownerId: string;

  policies?: readonly string[];

  authorities?: readonly string[];

  status?: ExecutiveGovernanceStatus;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveGovernance(
  input:
    CreateExecutiveGovernanceInput,
): ExecutiveGovernance {

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

    policies:
      Object.freeze([
        ...(input.policies ??
          []),
      ]),

    authorities:
      Object.freeze([
        ...(input.authorities ??
          []),
      ]),

    status:
      input.status ??
      "draft",

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
