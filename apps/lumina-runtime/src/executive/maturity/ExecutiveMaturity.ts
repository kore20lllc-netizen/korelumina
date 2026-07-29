export type ExecutiveMaturityStatus =
  | "planned"
  | "developing"
  | "mature"
  | "optimized"
  | "validated";

export interface ExecutiveMaturity {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveMaturityStatus;

  readonly maturityScore: number;

  readonly governanceMaturity: number;

  readonly processMaturity: number;

  readonly operationalMaturity: number;

  readonly maturityMilestones:
    readonly string[];

  readonly maturityRecommendations:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveMaturityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  maturityScore?: number;

  governanceMaturity?: number;

  processMaturity?: number;

  operationalMaturity?: number;

  status?:
    ExecutiveMaturityStatus;

  maturityMilestones?:
    readonly string[];

  maturityRecommendations?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function
createExecutiveMaturity(
  input:
    CreateExecutiveMaturityInput,
): ExecutiveMaturity {

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

    maturityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.maturityScore ??
            100,
        ),
      ),

    governanceMaturity:
      Math.max(
        0,
        Math.min(
          100,
          input.governanceMaturity ??
            100,
        ),
      ),

    processMaturity:
      Math.max(
        0,
        Math.min(
          100,
          input.processMaturity ??
            100,
        ),
      ),

    operationalMaturity:
      Math.max(
        0,
        Math.min(
          100,
          input.operationalMaturity ??
            100,
        ),
      ),

    maturityMilestones:
      Object.freeze([
        ...(input.maturityMilestones ??
          []),
      ]),

    maturityRecommendations:
      Object.freeze([
        ...(input.maturityRecommendations ??
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
