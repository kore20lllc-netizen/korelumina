import type {
  ExecutiveEvent,
  ExecutiveEventActor,
  ExecutiveEventCategory,
  ExecutiveEventConfidence,
  ExecutiveEventEvidence,
} from "../events/index.js";

export interface ExecutiveObservation<
  TPayload = Readonly<
    Record<string, unknown>
  >,
> {
  id: string;

  eventId: string;

  eventType: string;

  category:
    ExecutiveEventCategory;

  source: string;

  workspace?: string;

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

  observedAt: number;

  recordedAt: number;
}

export function createExecutiveObservation<
  TPayload = Readonly<
    Record<string, unknown>
  >,
>(
  event: ExecutiveEvent<TPayload>,
  options: {
    id?: string;
    recordedAt?: number;
  } = {},
): ExecutiveObservation<TPayload> {
  const recordedAt =
    options.recordedAt ??
    Date.now();

  return Object.freeze({
    id:
      options.id ??
      `observation:${event.id}`,

    eventId:
      event.id,

    eventType:
      event.type,

    category:
      event.category,

    source:
      event.source,

    workspace:
      event.workspace,

    actor:
      Object.freeze({
        ...event.actor,
      }),

    projectId:
      event.projectId,

    missionId:
      event.missionId,

    confidence:
      event.confidence,

    evidence:
      Object.freeze(
        event.evidence.map(
          (evidence) =>
            Object.freeze({
              ...evidence,
            }),
        ),
      ),

    payload:
      event.payload,

    correlationId:
      event.correlationId,

    causationId:
      event.causationId,

    observedAt:
      event.timestamp,

    recordedAt,
  });
}
