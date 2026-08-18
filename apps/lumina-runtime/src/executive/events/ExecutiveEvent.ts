export type ExecutiveEventCategory =
  | "genesis"
  | "architecture"
  | "knowledge"
  | "design"
  | "engineering"
  | "runtime"
  | "governance"
  | "mission"
  | "customer"
  | "business"
  | "security"
  | "quality"
  | "system";

export type ExecutiveEventConfidence =
  | "unverified"
  | "low"
  | "medium"
  | "high"
  | "validated";

export interface ExecutiveEventActor {
  id: string;

  type:
    | "human"
    | "chief-agent"
    | "specialized-agent"
    | "workspace"
    | "runtime"
    | "system";

  label?: string;
}

export interface ExecutiveEventEvidence {
  id: string;

  type:
    | "document"
    | "code"
    | "runtime-state"
    | "metric"
    | "decision"
    | "conversation"
    | "artifact"
    | "external";

  uri?: string;

  summary?: string;
}

export interface ExecutiveEvent<
  TPayload = Readonly<
    Record<string, unknown>
  >,
> {
  id: string;

  type: string;

  category:
    ExecutiveEventCategory;

  timestamp: number;

  source: string;

  workspace?: string;

  organizationId?: string;

  actor:
    ExecutiveEventActor;

  projectId?: string;

  missionId?: string;

  confidence:
    ExecutiveEventConfidence;

  evidence:
    readonly ExecutiveEventEvidence[];

  payload:
    TPayload;

  correlationId?: string;

  causationId?: string;
}

export function createExecutiveEvent<
  TPayload = Readonly<
    Record<string, unknown>
  >,
>(
  event: Omit<
    ExecutiveEvent<TPayload>,
    "timestamp" | "evidence"
  > & {
    timestamp?: number;

    evidence?:
      readonly ExecutiveEventEvidence[];
  },
): ExecutiveEvent<TPayload> {
  return {
    ...event,

    timestamp:
      event.timestamp ??
      Date.now(),

    evidence:
      event.evidence ?? [],
  };
}
