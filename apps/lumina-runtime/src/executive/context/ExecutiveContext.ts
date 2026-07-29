export interface ExecutiveContextReference {
  id: string;

  label?: string;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export interface ExecutiveContext {
  organizationId?: string;

  user?: ExecutiveContextReference;

  project?: ExecutiveContextReference;

  workspace?: ExecutiveContextReference;

  mission?: ExecutiveContextReference;

  repository?: ExecutiveContextReference;

  runtime?: ExecutiveContextReference;

  knowledgeState?: ExecutiveContextReference;

  activeAgents:
    readonly ExecutiveContextReference[];

  observedAt: number;
}

export function createExecutiveContext(
  context: Omit<
    ExecutiveContext,
    "activeAgents" | "observedAt"
  > & {
    activeAgents?:
      readonly ExecutiveContextReference[];

    observedAt?: number;
  } = {},
): ExecutiveContext {
  return {
    ...context,

    activeAgents:
      context.activeAgents ?? [],

    observedAt:
      context.observedAt ??
      Date.now(),
  };
}
