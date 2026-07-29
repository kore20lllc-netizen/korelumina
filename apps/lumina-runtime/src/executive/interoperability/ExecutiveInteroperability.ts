export type ExecutiveInteroperabilityStatus =
  | "planned"
  | "integrating"
  | "interoperable"
  | "optimized"
  | "validated";

export interface ExecutiveInteroperability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveInteroperabilityStatus;

  readonly interoperabilityScore: number;

  readonly compatibilityScore: number;

  readonly integrationCoverage: number;

  readonly standardsCompliance: number;

  readonly connectedSystems:
    readonly string[];

  readonly integrationStandards:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<Record<string, unknown>>;
}

export interface CreateExecutiveInteroperabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  interoperabilityScore?: number;

  compatibilityScore?: number;

  integrationCoverage?: number;

  standardsCompliance?: number;

  status?:
    ExecutiveInteroperabilityStatus;

  connectedSystems?:
    readonly string[];

  integrationStandards?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<Record<string, unknown>>;
}

export function createExecutiveInteroperability(
  input: CreateExecutiveInteroperabilityInput,
): ExecutiveInteroperability {

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

    interoperabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.interoperabilityScore ??
            100,
        ),
      ),

    compatibilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.compatibilityScore ??
            100,
        ),
      ),

    integrationCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.integrationCoverage ??
            100,
        ),
      ),

    standardsCompliance:
      Math.max(
        0,
        Math.min(
          100,
          input.standardsCompliance ??
            100,
        ),
      ),

    connectedSystems:
      Object.freeze([
        ...(input.connectedSystems ?? []),
      ]),

    integrationStandards:
      Object.freeze([
        ...(input.integrationStandards ?? []),
      ]),

    createdAt:
      now,

    updatedAt:
      now,

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),
  });
}
