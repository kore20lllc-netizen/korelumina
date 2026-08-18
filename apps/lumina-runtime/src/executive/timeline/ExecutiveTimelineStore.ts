import type {
  ExecutiveTimelineEvent,
  ExecutiveTimelineEventType,
} from "./ExecutiveTimelineEvent.js";

export interface ExecutiveTimelineSnapshot {
  readonly sessionId: string;
  readonly events: readonly ExecutiveTimelineEvent[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

export class ExecutiveTimelineStore {

  private readonly timelines =
    new Map<
      string,
      ExecutiveTimelineSnapshot
    >();

  create(
    sessionId: string,
  ): ExecutiveTimelineSnapshot {

    const now = Date.now();

    const snapshot: ExecutiveTimelineSnapshot =
      Object.freeze({
        sessionId,
        events: Object.freeze([]),
        createdAt: now,
        updatedAt: now,
      });

    this.timelines.set(
      sessionId,
      snapshot,
    );

    return snapshot;
  }

  get(
    sessionId: string,
  ): ExecutiveTimelineSnapshot | undefined {
    return this.timelines.get(
      sessionId,
    );
  }

  append(
    sessionId: string,
    event: ExecutiveTimelineEvent,
  ): ExecutiveTimelineSnapshot {

    const existing =
      this.get(sessionId) ??
      this.create(sessionId);

    const snapshot =
      Object.freeze({
        ...existing,
        events: Object.freeze([
          ...existing.events,
          event,
        ]),
        updatedAt: Date.now(),
      });

    this.timelines.set(
      sessionId,
      snapshot,
    );

    return snapshot;
  }

  list(): readonly ExecutiveTimelineSnapshot[] {
    return Object.freeze(
      Array.from(
        this.timelines.values(),
      ),
    );
  }

  findByEventType(
    type: ExecutiveTimelineEventType,
  ): readonly ExecutiveTimelineEvent[] {

    return Object.freeze(
      this.list().flatMap(
        (timeline) =>
          timeline.events.filter(
            (event) =>
              event.type === type,
          ),
      ),
    );
  }

  clear(): void {
    this.timelines.clear();
  }
}
