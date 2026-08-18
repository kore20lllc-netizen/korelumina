export type ExecutiveAuthorityKind =
  | "genesis"
  | "constitution"
  | "governance"
  | "architecture"
  | "knowledge"
  | "runtime"
  | "memory"
  | "learning";

export interface ExecutiveAuthority {

  readonly id: string;

  readonly kind:
    ExecutiveAuthorityKind;

  readonly title: string;

  readonly description: string;

  readonly priority: number;

  readonly source: string;

  readonly version: string;

  readonly active: boolean;

  readonly createdAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAuthorityInput {

  id: string;

  kind:
    ExecutiveAuthorityKind;

  title: string;

  description: string;

  priority: number;

  source: string;

  version?: string;

  active?: boolean;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAuthority(
  input:
    CreateExecutiveAuthorityInput,
): ExecutiveAuthority {

  return Object.freeze({
    id:
      input.id.trim(),

    kind:
      input.kind,

    title:
      input.title.trim(),

    description:
      input.description.trim(),

    priority:
      input.priority,

    source:
      input.source.trim(),

    version:
      input.version ??
      "1.0.0",

    active:
      input.active ??
      true,

    createdAt:
      input.createdAt ??
      Date.now(),

    metadata:
      Object.freeze({
        ...(input.metadata ??
          {}),
      }),
  });
}
