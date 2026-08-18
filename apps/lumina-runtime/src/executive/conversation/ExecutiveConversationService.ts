import {
  ExecutiveConversationStore,
} from "./ExecutiveConversationStore.js";

import {
  createExecutiveConversationEntry,
  type CreateExecutiveConversationEntryInput,
  type ExecutiveConversationEntry,
} from "./ExecutiveConversationEntry.js";

import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

export class ExecutiveConversationService {

  constructor(
    private readonly store =
      new ExecutiveConversationStore(),

    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  append(
    input:
      CreateExecutiveConversationEntryInput,
  ): ExecutiveConversationEntry {

    const conversation =
      this.store.getOrCreate(
        input.sessionId,
      );

    const entry =
      createExecutiveConversationEntry(
        input,
      );

    conversation.append(
      entry,
    );

    this.timeline.record({
      id:
        `${entry.id}:timeline`,
      sessionId:
        entry.sessionId,
      type:
        "conversation-message",
      actorId:
        entry.authorId,
      source:
        "executive-conversation",
      title:
        "Conversation Message",
      summary:
        entry.content,
      payload: {
        conversationEntryId:
          entry.id,
      },
    });

    return entry;
  }

  conversation(
    sessionId: string,
  ) {
    return this.store.get(
      sessionId,
    );
  }

  conversations() {
    return this.store.list();
  }

  clear(): void {
    this.store.clear();
    this.timeline.clear();
  }
}

export function
createExecutiveConversationService() {
  return new ExecutiveConversationService();
}
