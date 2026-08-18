export type ExecutiveExtensibilityStatus =
  | "planned"
  | "extensible"
  | "extending"
  | "optimized"
  | "validated";

export interface ExecutiveExtensibility {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveExtensibilityStatus;

  readonly extensibilityScore: number;

  readonly pluginCoverage: number;

  readonly apiExtensibility: number;

  readonly customizationScore: number;

  readonly extensionPoints:
    readonly string[];

  readonly extensionModules:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveExtensibilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  extensibilityScore?: number;

  pluginCoverage?: number;

  apiExtensibility?: number;

  customizationScore?: number;

  status?: ExecutiveExtensibilityStatus;

  extensionPoints?: readonly string[];

  extensionModules?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveExtensibility(
  input:
    CreateExecutiveExtensibilityInput,
): ExecutiveExtensibility {

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

    extensibilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.extensibilityScore ??
            100,
        ),
      ),

    pluginCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.pluginCoverage ??
            100,
        ),
      ),

    apiExtensibility:
      Math.max(
        0,
        Math.min(
          100,
          input.apiExtensibility ??
            100,
        ),
      ),

    customizationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.customizationScore ??
            100,
        ),
      ),

    extensionPoints:
      Object.freeze([
        ...(input.extensionPoints ??
          []),
      ]),

    extensionModules:
      Object.freeze([
        ...(input.extensionModules ??
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
