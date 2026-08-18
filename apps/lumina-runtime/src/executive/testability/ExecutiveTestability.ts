export type ExecutiveTestabilityStatus =
  | "planned"
  | "testable"
  | "testing"
  | "optimized"
  | "validated";

export interface ExecutiveTestability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveTestabilityStatus;

  readonly testabilityScore: number;

  readonly automationCoverage: number;

  readonly observabilityScore: number;

  readonly verificationReadiness: number;

  readonly testSuites:
    readonly string[];

  readonly qualityChecks:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveTestabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  testabilityScore?: number;

  automationCoverage?: number;

  observabilityScore?: number;

  verificationReadiness?: number;

  status?: ExecutiveTestabilityStatus;

  testSuites?: readonly string[];

  qualityChecks?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveTestability(
  input:
    CreateExecutiveTestabilityInput,
): ExecutiveTestability {

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

    testabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.testabilityScore ??
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

    observabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.observabilityScore ??
            100,
        ),
      ),

    verificationReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.verificationReadiness ??
            100,
        ),
      ),

    testSuites:
      Object.freeze([
        ...(input.testSuites ??
          []),
      ]),

    qualityChecks:
      Object.freeze([
        ...(input.qualityChecks ??
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
