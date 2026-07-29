export type ExecutiveAdminabilityStatus =
  | "planned"
  | "administerable"
  | "administering"
  | "optimized"
  | "validated";

export interface ExecutiveAdminability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAdminabilityStatus;

  readonly adminabilityScore: number;

  readonly administrativeCoverage: number;

  readonly policyAutomation: number;

  readonly governanceReadiness: number;

  readonly administrativeFunctions:
    readonly string[];

  readonly managementInterfaces:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAdminabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  adminabilityScore?: number;

  administrativeCoverage?: number;

  policyAutomation?: number;

  governanceReadiness?: number;

  status?: ExecutiveAdminabilityStatus;

  administrativeFunctions?: readonly string[];

  managementInterfaces?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAdminability(
  input:
    CreateExecutiveAdminabilityInput,
): ExecutiveAdminability {

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

    adminabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.adminabilityScore ??
            100,
        ),
      ),

    administrativeCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.administrativeCoverage ??
            100,
        ),
      ),

    policyAutomation:
      Math.max(
        0,
        Math.min(
          100,
          input.policyAutomation ??
            100,
        ),
      ),

    governanceReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.governanceReadiness ??
            100,
        ),
      ),

    administrativeFunctions:
      Object.freeze([
        ...(input.administrativeFunctions ??
          []),
      ]),

    managementInterfaces:
      Object.freeze([
        ...(input.managementInterfaces ??
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
