export type ExecutiveServiceabilityStatus =
  | "planned"
  | "supported"
  | "servicing"
  | "optimized"
  | "verified";

export interface ExecutiveServiceability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveServiceabilityStatus;

  readonly serviceabilityScore: number;

  readonly meanTimeToDetect: number;

  readonly meanTimeToRepair: number;

  readonly automationCoverage: number;

  readonly runbooks:
    readonly string[];

  readonly supportCapabilities:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveServiceabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  serviceabilityScore?: number;

  meanTimeToDetect?: number;

  meanTimeToRepair?: number;

  automationCoverage?: number;

  status?: ExecutiveServiceabilityStatus;

  runbooks?: readonly string[];

  supportCapabilities?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveServiceability(
  input:
    CreateExecutiveServiceabilityInput,
): ExecutiveServiceability {

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

    serviceabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.serviceabilityScore ??
            100,
        ),
      ),

    meanTimeToDetect:
      Math.max(
        0,
        input.meanTimeToDetect ??
          0,
      ),

    meanTimeToRepair:
      Math.max(
        0,
        input.meanTimeToRepair ??
          0,
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

    runbooks:
      Object.freeze([
        ...(input.runbooks ??
          []),
      ]),

    supportCapabilities:
      Object.freeze([
        ...(input.supportCapabilities ??
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
