export type ExecutiveCapacityStatus =
  | "healthy"
  | "constrained"
  | "critical"
  | "recovering";

export interface ExecutiveCapacity {

  readonly id: string;

  readonly sessionId: string;

  readonly name: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveCapacityStatus;

  readonly available: number;

  readonly allocated: number;

  readonly reserved: number;

  readonly utilization: number;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveCapacityInput {

  id: string;

  sessionId: string;

  name: string;

  ownerId: string;

  available: number;

  allocated?: number;

  reserved?: number;

  utilization?: number;

  status?: ExecutiveCapacityStatus;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveCapacity(
  input:
    CreateExecutiveCapacityInput,
): ExecutiveCapacity {

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

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "healthy",

    available:
      input.available,

    allocated:
      input.allocated ??
      0,

    reserved:
      input.reserved ??
      0,

    utilization:
      Math.max(
        0,
        Math.min(
          100,
          input.utilization ??
            0,
        ),
      ),

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
