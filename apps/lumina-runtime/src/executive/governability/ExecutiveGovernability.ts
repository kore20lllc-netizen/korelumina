export type ExecutiveGovernabilityStatus =
  | "planned"
  | "governable"
  | "governing"
  | "optimized"
  | "validated";

export interface ExecutiveGovernability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveGovernabilityStatus;

  readonly governabilityScore: number;

  readonly policyCoverage: number;

  readonly governanceAutomation: number;

  readonly oversightReadiness: number;

  readonly governancePolicies:
    readonly string[];

  readonly governanceFrameworks:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveGovernabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  governabilityScore?: number;

  policyCoverage?: number;

  governanceAutomation?: number;

  oversightReadiness?: number;

  status?: ExecutiveGovernabilityStatus;

  governancePolicies?: readonly string[];

  governanceFrameworks?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveGovernability(
  input:
    CreateExecutiveGovernabilityInput,
): ExecutiveGovernability {

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

    governabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.governabilityScore ??
            100,
        ),
      ),

    policyCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.policyCoverage ??
            100,
        ),
      ),

    governanceAutomation:
      Math.max(
        0,
        Math.min(
          100,
          input.governanceAutomation ??
            100,
        ),
      ),

    oversightReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.oversightReadiness ??
            100,
        ),
      ),

    governancePolicies:
      Object.freeze([
        ...(input.governancePolicies ??
          []),
      ]),

    governanceFrameworks:
      Object.freeze([
        ...(input.governanceFrameworks ??
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
