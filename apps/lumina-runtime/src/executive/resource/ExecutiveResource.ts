export type ExecutiveResourceStatus =
  | "available"
  | "allocated"
  | "constrained"
  | "depleted";

export interface ExecutiveResource {

  readonly id: string;

  readonly sessionId: string;

  readonly name: string;

  readonly category: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveResourceStatus;

  readonly capacity: number;

  readonly utilization: number;

  readonly allocations:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveResourceInput {

  id: string;

  sessionId: string;

  name: string;

  category: string;

  ownerId: string;

  status?: ExecutiveResourceStatus;

  capacity: number;

  utilization?: number;

  allocations?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveResource(
  input:
    CreateExecutiveResourceInput,
): ExecutiveResource {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    name:
      input.name.trim(),

    category:
      input.category.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "available",

    capacity:
      input.capacity,

    utilization:
      Math.max(
        0,
        Math.min(
          100,
          input.utilization ??
            0,
        ),
      ),

    allocations:
      Object.freeze([
        ...(input.allocations ??
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
