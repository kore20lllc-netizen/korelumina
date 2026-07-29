export type ExecutiveControllabilityStatus =
  | "planned"
  | "controllable"
  | "controlling"
  | "optimized"
  | "validated";

export interface ExecutiveControllability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveControllabilityStatus;

  readonly controllabilityScore: number;

  readonly automationControlScore: number;

  readonly policyEnforcementScore: number;

  readonly governanceControlScore: number;

  readonly controlCapabilities:
    readonly string[];

  readonly controlPolicies:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveControllabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  controllabilityScore?: number;

  automationControlScore?: number;

  policyEnforcementScore?: number;

  governanceControlScore?: number;

  status?: ExecutiveControllabilityStatus;

  controlCapabilities?: readonly string[];

  controlPolicies?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveControllability(
  input:
    CreateExecutiveControllabilityInput,
): ExecutiveControllability {

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

    controllabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.controllabilityScore ??
            100,
        ),
      ),

    automationControlScore:
      Math.max(
        0,
        Math.min(
          100,
          input.automationControlScore ??
            100,
        ),
      ),

    policyEnforcementScore:
      Math.max(
        0,
        Math.min(
          100,
          input.policyEnforcementScore ??
            100,
        ),
      ),

    governanceControlScore:
      Math.max(
        0,
        Math.min(
          100,
          input.governanceControlScore ??
            100,
        ),
      ),

    controlCapabilities:
      Object.freeze([
        ...(input.controlCapabilities ??
          []),
      ]),

    controlPolicies:
      Object.freeze([
        ...(input.controlPolicies ??
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
