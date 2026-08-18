export type ExecutiveAccessibilityStatus =
  | "planned"
  | "accessible"
  | "improving"
  | "optimized"
  | "validated";

export interface ExecutiveAccessibility {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAccessibilityStatus;

  readonly accessibilityScore: number;

  readonly complianceScore: number;

  readonly usabilityScore: number;

  readonly inclusivityScore: number;

  readonly supportedStandards:
    readonly string[];

  readonly accessibilityFeatures:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAccessibilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  accessibilityScore?: number;

  complianceScore?: number;

  usabilityScore?: number;

  inclusivityScore?: number;

  status?: ExecutiveAccessibilityStatus;

  supportedStandards?: readonly string[];

  accessibilityFeatures?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAccessibility(
  input:
    CreateExecutiveAccessibilityInput,
): ExecutiveAccessibility {

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

    accessibilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.accessibilityScore ??
            100,
        ),
      ),

    complianceScore:
      Math.max(
        0,
        Math.min(
          100,
          input.complianceScore ??
            100,
        ),
      ),

    usabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.usabilityScore ??
            100,
        ),
      ),

    inclusivityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.inclusivityScore ??
            100,
        ),
      ),

    supportedStandards:
      Object.freeze([
        ...(input.supportedStandards ??
          []),
      ]),

    accessibilityFeatures:
      Object.freeze([
        ...(input.accessibilityFeatures ??
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
