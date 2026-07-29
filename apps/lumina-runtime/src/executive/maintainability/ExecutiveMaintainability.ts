export type ExecutiveMaintainabilityStatus =
  | "planned"
  | "maintainable"
  | "improving"
  | "refactoring"
  | "optimized";

export interface ExecutiveMaintainability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveMaintainabilityStatus;

  readonly maintainabilityScore: number;

  readonly technicalDebtScore: number;

  readonly documentationCoverage: number;

  readonly codeHealth: number;

  readonly initiatives:
    readonly string[];

  readonly debtItems:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveMaintainabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  maintainabilityScore?: number;

  technicalDebtScore?: number;

  documentationCoverage?: number;

  codeHealth?: number;

  status?: ExecutiveMaintainabilityStatus;

  initiatives?: readonly string[];

  debtItems?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveMaintainability(
  input:
    CreateExecutiveMaintainabilityInput,
): ExecutiveMaintainability {

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

    maintainabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.maintainabilityScore ??
            100,
        ),
      ),

    technicalDebtScore:
      Math.max(
        0,
        Math.min(
          100,
          input.technicalDebtScore ??
            0,
        ),
      ),

    documentationCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.documentationCoverage ??
            100,
        ),
      ),

    codeHealth:
      Math.max(
        0,
        Math.min(
          100,
          input.codeHealth ??
            100,
        ),
      ),

    initiatives:
      Object.freeze([
        ...(input.initiatives ??
          []),
      ]),

    debtItems:
      Object.freeze([
        ...(input.debtItems ??
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
