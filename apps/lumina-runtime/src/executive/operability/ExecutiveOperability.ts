export type ExecutiveOperabilityStatus =
  | "planned"
  | "operational"
  | "operating"
  | "optimized"
  | "validated";

export interface ExecutiveOperability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveOperabilityStatus;

  readonly operabilityScore: number;

  readonly operationalReadiness: number;

  readonly automationCoverage: number;

  readonly supportabilityScore: number;

  readonly operatingProcedures:
    readonly string[];

  readonly operationalCapabilities:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveOperabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  operabilityScore?: number;

  operationalReadiness?: number;

  automationCoverage?: number;

  supportabilityScore?: number;

  status?: ExecutiveOperabilityStatus;

  operatingProcedures?: readonly string[];

  operationalCapabilities?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveOperability(
  input:
    CreateExecutiveOperabilityInput,
): ExecutiveOperability {

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

    operabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.operabilityScore ??
            100,
        ),
      ),

    operationalReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.operationalReadiness ??
            100,
        ),
      ),

    automationCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.automationCoverage ??
            100,
        ),
      ),

    supportabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.supportabilityScore ??
            100,
        ),
      ),

    operatingProcedures:
      Object.freeze([
        ...(input.operatingProcedures ??
          []),
      ]),

    operationalCapabilities:
      Object.freeze([
        ...(input.operationalCapabilities ??
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
