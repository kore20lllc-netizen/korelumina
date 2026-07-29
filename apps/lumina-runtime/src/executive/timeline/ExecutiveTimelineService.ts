import {
  ExecutiveTimelineStore,
} from "./ExecutiveTimelineStore.js";

import {
  createExecutiveTimelineEvent,
  type CreateExecutiveTimelineEventInput,
  type ExecutiveTimelineEvent,
} from "./ExecutiveTimelineEvent.js";

export class ExecutiveTimelineService {

  constructor(
    private readonly store =
      new ExecutiveTimelineStore(),
  ) {}

  record(
    input:
      CreateExecutiveTimelineEventInput,
  ): ExecutiveTimelineEvent {

    const event =
      createExecutiveTimelineEvent(
        input,
      );

    this.store.append(
      input.sessionId,
      event,
    );

    return event;
  }

  timeline(
    sessionId: string,
  ) {
    return this.store.get(
      sessionId,
    );
  }

  timelines() {
    return this.store.list();
  }

  clear(): void {
    this.store.clear();
  }
}

export function
createExecutiveTimelineService() {
  return new ExecutiveTimelineService();
}
