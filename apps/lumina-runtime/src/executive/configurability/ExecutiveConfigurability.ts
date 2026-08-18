export type ExecutiveConfigurabilityStatus =
  | "planned"
  | "configurable"
  | "configuring"
  | "optimized"
  | "validated";

export interface ExecutiveConfigurability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveConfigurabilityStatus;

  readonly configurabilityScore: number;

  readonly flexibilityScore: number;

  readonly policyCoverage: number;

  readonly automationReadiness: number;

  readonly configurationProfiles:
    readonly string[];

  readonly configurableDomains:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveConfigurabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  configurabilityScore?: number;

  flexibilityScore?: number;

  policyCoverage?: number;

  automationReadiness?: number;

  status?: ExecutiveConfigurabilityStatus;

  configurationProfiles?: readonly string[];

  configurableDomains?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveConfigurability(
  input:
    CreateExecutiveConfigurabilityInput,
): ExecutiveConfigurability {

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

    configurabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.configurabilityScore ??
            100,
        ),
      ),

    flexibilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.flexibilityScore ??
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

    automationReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.automationReadiness ??
            100,
        ),
      ),

    configurationProfiles:
      Object.freeze([
        ...(input.configurationProfiles ??
          []),
      ]),

    configurableDomains:
      Object.freeze([
        ...(input.configurableDomains ??
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
