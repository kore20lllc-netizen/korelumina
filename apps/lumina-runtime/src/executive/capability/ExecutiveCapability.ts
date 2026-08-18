export type ExecutiveCapabilityStatus =
  | "planned"
  | "available"
  | "deprecated"
  | "retired";

export interface ExecutiveCapability {

  readonly id: string;

  readonly name: string;

  readonly description: string;

  readonly ownerId: string;

  readonly category: string;

  readonly status:
    ExecutiveCapabilityStatus;

  readonly dependencies:
    readonly string[];

  readonly interfaces:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveCapabilityInput {

  id: string;

  name: string;

  description: string;

  ownerId: string;

  category: string;

  status?: ExecutiveCapabilityStatus;

  dependencies?: readonly string[];

  interfaces?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveCapability(
  input:
    CreateExecutiveCapabilityInput,
): ExecutiveCapability {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    name:
      input.name.trim(),

    description:
      input.description.trim(),

    ownerId:
      input.ownerId.trim(),

    category:
      input.category.trim(),

    status:
      input.status ??
      "planned",

    dependencies:
      Object.freeze([
        ...(input.dependencies ??
          []),
      ]),

    interfaces:
      Object.freeze([
        ...(input.interfaces ??
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
