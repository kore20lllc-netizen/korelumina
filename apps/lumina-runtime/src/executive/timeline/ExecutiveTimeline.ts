import type {
  ExecutiveTimelineEvent,
  ExecutiveTimelineEventType,
} from "./ExecutiveTimelineEvent.js";

export class ExecutiveTimeline {

  private events:
    readonly ExecutiveTimelineEvent[] = [];

  append(
    event: ExecutiveTimelineEvent,
  ): void {
    this.events = Object.freeze([
      ...this.events,
      event,
    ]);
  }

  latest():
    ExecutiveTimelineEvent | undefined {
    return this.events.at(-1);
  }

  snapshot():
    readonly ExecutiveTimelineEvent[] {
    return this.events;
  }

  byType(
    type: ExecutiveTimelineEventType,
  ): readonly ExecutiveTimelineEvent[] {
    return this.events.filter(
      (event) =>
        event.type === type,
    );
  }

  byActor(
    actorId: string,
  ): readonly ExecutiveTimelineEvent[] {
    return this.events.filter(
      (event) =>
        event.actorId === actorId,
    );
  }

  since(
    timestamp: number,
  ): readonly ExecutiveTimelineEvent[] {
    return this.events.filter(
      (event) =>
        event.timestamp >= timestamp,
    );
  }

  size(): number {
    return this.events.length;
  }

  isEmpty(): boolean {
    return this.events.length === 0;
  }
}
