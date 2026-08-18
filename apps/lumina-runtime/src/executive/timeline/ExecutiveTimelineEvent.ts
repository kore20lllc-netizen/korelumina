export type ExecutiveTimelineEventType =
  | "intent-created"
  | "participant-added"
  | "participant-removed"
  | "briefing-started"
  | "conversation-started"
  | "conversation-message"
  | "decision-requested"
  | "decision-approved"
  | "decision-rejected"
  | "delegation"
  | "runtime-event"
  | "observation"
  | "reflection"
  | "memory-created"
  | "learning-created";

export interface ExecutiveTimelineEvent {
  readonly id: string;
  readonly sessionId: string;
  readonly timestamp: number;

  readonly type: ExecutiveTimelineEventType;

  readonly actorId: string;
  readonly source: string;

  readonly title: string;
  readonly summary: string;

  readonly payload: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface CreateExecutiveTimelineEventInput {
  id: string;
  sessionId: string;
  type: ExecutiveTimelineEventType;
  actorId: string;
  source: string;
  title: string;
  summary: string;
  timestamp?: number;
  payload?: Readonly<Record<string, unknown>>;
  metadata?: Readonly<Record<string, unknown>>;
}

export function createExecutiveTimelineEvent(
  input: CreateExecutiveTimelineEventInput,
): ExecutiveTimelineEvent {
  return Object.freeze({
    id: input.id.trim(),
    sessionId: input.sessionId.trim(),
    timestamp: input.timestamp ?? Date.now(),
    type: input.type,
    actorId: input.actorId.trim(),
    source: input.source.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    payload: Object.freeze({
      ...(input.payload ?? {}),
    }),
    metadata: Object.freeze({
      ...(input.metadata ?? {}),
    }),
  });
}
