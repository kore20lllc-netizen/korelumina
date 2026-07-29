export type ExecutiveProductivityStatus =
  | "planned"
  | "productive"
  | "improving"
  | "optimized"
  | "validated";

export interface ExecutiveProductivity {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveProductivityStatus;

  readonly productivityScore: number;

  readonly throughputScore: number;

  readonly focusScore: number;

  readonly deliveryVelocity: number;

  readonly completedObjectives:
    readonly string[];

  readonly productivityInitiatives:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveProductivityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  productivityScore?: number;

  throughputScore?: number;

  focusScore?: number;

  deliveryVelocity?: number;

  status?: ExecutiveProductivityStatus;

  completedObjectives?: readonly string[];

  productivityInitiatives?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveProductivity(
  input:
    CreateExecutiveProductivityInput,
): ExecutiveProductivity {

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
      "planned",

    productivityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.productivityScore ??
            100,
        ),
      ),

    throughputScore:
      Math.max(
        0,
        Math.min(
          100,
          input.throughputScore ??
            100,
        ),
      ),

    focusScore:
      Math.max(
        0,
        Math.min(
          100,
          input.focusScore ??
            100,
        ),
      ),

    deliveryVelocity:
      Math.max(
        0,
        Math.min(
          100,
          input.deliveryVelocity ??
            100,
        ),
      ),

    completedObjectives:
      Object.freeze([
        ...(input.completedObjectives ??
          []),
      ]),

    productivityInitiatives:
      Object.freeze([
        ...(input.productivityInitiatives ??
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
