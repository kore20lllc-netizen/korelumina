export type ExecutiveAgilityStatus =
  | "planned"
  | "adapting"
  | "agile"
  | "optimized"
  | "validated";

export interface ExecutiveAgility {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAgilityStatus;

  readonly agilityScore: number;

  readonly responsivenessScore: number;

  readonly decisionVelocity: number;

  readonly deliveryVelocity: number;

  readonly agilityPractices:
    readonly string[];

  readonly adaptationEvents:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAgilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  agilityScore?: number;

  responsivenessScore?: number;

  decisionVelocity?: number;

  deliveryVelocity?: number;

  status?: ExecutiveAgilityStatus;

  agilityPractices?:
    readonly string[];

  adaptationEvents?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function createExecutiveAgility(
  input:
    CreateExecutiveAgilityInput,
): ExecutiveAgility {

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

    agilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.agilityScore ??
            100,
        ),
      ),

    responsivenessScore:
      Math.max(
        0,
        Math.min(
          100,
          input.responsivenessScore ??
            100,
        ),
      ),

    decisionVelocity:
      Math.max(
        0,
        Math.min(
          100,
          input.decisionVelocity ??
            100,
        ),
      ),

    deliveryVelocity:
      Math.max(
        0,
        Math.min(
          100,
          input.deliveryVelocity ??
            100,
        ),
      ),

    agilityPractices:
      Object.freeze([
        ...(input.agilityPractices ??
          []),
      ]),

    adaptationEvents:
      Object.freeze([
        ...(input.adaptationEvents ??
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
