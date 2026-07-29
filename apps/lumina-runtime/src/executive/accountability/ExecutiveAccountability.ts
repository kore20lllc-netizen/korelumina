export type ExecutiveAccountabilityStatus =
  | "planned"
  | "accountable"
  | "reviewing"
  | "optimized"
  | "validated";

export interface ExecutiveAccountability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAccountabilityStatus;

  readonly accountabilityScore: number;

  readonly ownershipCoverage: number;

  readonly decisionTransparency: number;

  readonly governanceAlignment: number;

  readonly accountableParties:
    readonly string[];

  readonly responsibilityAssignments:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAccountabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  accountabilityScore?: number;

  ownershipCoverage?: number;

  decisionTransparency?: number;

  governanceAlignment?: number;

  status?: ExecutiveAccountabilityStatus;

  accountableParties?: readonly string[];

  responsibilityAssignments?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAccountability(
  input:
    CreateExecutiveAccountabilityInput,
): ExecutiveAccountability {

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

    accountabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.accountabilityScore ??
            100,
        ),
      ),

    ownershipCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.ownershipCoverage ??
            100,
        ),
      ),

    decisionTransparency:
      Math.max(
        0,
        Math.min(
          100,
          input.decisionTransparency ??
            100,
        ),
      ),

    governanceAlignment:
      Math.max(
        0,
        Math.min(
          100,
          input.governanceAlignment ??
            100,
        ),
      ),

    accountableParties:
      Object.freeze([
        ...(input.accountableParties ??
          []),
      ]),

    responsibilityAssignments:
      Object.freeze([
        ...(input.responsibilityAssignments ??
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
