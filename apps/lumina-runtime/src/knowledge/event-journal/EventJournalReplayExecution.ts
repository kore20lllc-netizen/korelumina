import {
  runExecutionPipeline,
  type ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

import {
  getEventJournalProjections,
} from "./EventJournalProjectionRegistry.js";

import type {
  EventJournalReplayHandler,
} from "./EventJournalReplay.js";

export interface EventJournalReplayState
  extends Record<string, unknown> {
  handlersExecuted?: number;
  projectionsExecuted?: number;
}

export async function runEventJournalReplayExecution(
  entry: EventJournalEntry,
  handlers: EventJournalReplayHandler[] = [],
) {
  const stages: ExecutionStage<
    EventJournalEntry,
    EventJournalReplayState
  >[] = [];

  for (const handler of handlers) {
    if (!handler.supports(entry)) {
      continue;
    }

    stages.push({
      name: `handler:${handler.constructor.name}`,
      async run(context) {
        await handler.handle(context.input);

        context.state.handlersExecuted =
          (context.state.handlersExecuted ?? 0) + 1;

        return {
          stage: `handler:${handler.constructor.name}`,
          success: true,
        };
      },
    });
  }

  for (const projection of getEventJournalProjections(entry)) {
    stages.push({
      name: `projection:${projection.name}`,
      async run(context) {
        await projection.project(context.input);

        context.state.projectionsExecuted =
          (context.state.projectionsExecuted ?? 0) + 1;

        return {
          stage: `projection:${projection.name}`,
          success: true,
        };
      },
    });
  }

  return runExecutionPipeline(
    {
      id: `event-journal-replay:${entry.id}`,
      input: entry,
      state: {},
      metadata: {
        eventId: entry.eventId,
        eventType: entry.eventType,
        objectType: entry.objectType,
        objectId: entry.objectId,
      },
    },
    stages,
  );
}
