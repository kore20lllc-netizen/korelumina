export type ExecutiveAvailabilityStatus =
  | "available"
  | "limited"
  | "degraded"
  | "unavailable"
  | "restored";

export interface ExecutiveAvailability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAvailabilityStatus;

  readonly availability: number;

  readonly targetAvailability: number;

  readonly uptimeMinutes: number;

  readonly downtimeMinutes: number;

  readonly services:
    readonly string[];

  readonly incidents:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAvailabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  availability?: number;

  targetAvailability?: number;

  uptimeMinutes?: number;

  downtimeMinutes?: number;

  status?: ExecutiveAvailabilityStatus;

  services?: readonly string[];

  incidents?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAvailability(
  input:
    CreateExecutiveAvailabilityInput,
): ExecutiveAvailability {

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
      "available",

    availability:
      Math.max(
        0,
        Math.min(
          100,
          input.availability ??
            100,
        ),
      ),

    targetAvailability:
      Math.max(
        0,
        Math.min(
          100,
          input.targetAvailability ??
            100,
        ),
      ),

    uptimeMinutes:
      Math.max(
        0,
        input.uptimeMinutes ??
          0,
      ),

    downtimeMinutes:
      Math.max(
        0,
        input.downtimeMinutes ??
          0,
      ),

    services:
      Object.freeze([
        ...(input.services ??
          []),
      ]),

    incidents:
      Object.freeze([
        ...(input.incidents ??
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
