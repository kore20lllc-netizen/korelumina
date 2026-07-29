export type ExecutiveManageabilityStatus =
  | "planned"
  | "manageable"
  | "managing"
  | "optimized"
  | "validated";

export interface ExecutiveManageability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveManageabilityStatus;

  readonly manageabilityScore: number;

  readonly administrationScore: number;

  readonly governanceCoverage: number;

  readonly operationalEfficiency: number;

  readonly managementCapabilities:
    readonly string[];

  readonly administrativeControls:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveManageabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  manageabilityScore?: number;

  administrationScore?: number;

  governanceCoverage?: number;

  operationalEfficiency?: number;

  status?: ExecutiveManageabilityStatus;

  managementCapabilities?: readonly string[];

  administrativeControls?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveManageability(
  input:
    CreateExecutiveManageabilityInput,
): ExecutiveManageability {

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

    manageabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.manageabilityScore ??
            100,
        ),
      ),

    administrationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.administrationScore ??
            100,
        ),
      ),

    governanceCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.governanceCoverage ??
            100,
        ),
      ),

    operationalEfficiency:
      Math.max(
        0,
        Math.min(
          100,
          input.operationalEfficiency ??
            100,
        ),
      ),

    managementCapabilities:
      Object.freeze([
        ...(input.managementCapabilities ??
          []),
      ]),

    administrativeControls:
      Object.freeze([
        ...(input.administrativeControls ??
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
