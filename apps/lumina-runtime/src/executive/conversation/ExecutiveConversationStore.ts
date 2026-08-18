import {
  ExecutiveConversation,
} from "./ExecutiveConversation.js";

export class ExecutiveConversationStore {

  private readonly conversations =
    new Map<
      string,
      ExecutiveConversation
    >();

  create(
    sessionId: string,
  ): ExecutiveConversation {

    let conversation =
      this.conversations.get(
        sessionId,
      );

    if (conversation) {
      return conversation;
    }

    conversation =
      new ExecutiveConversation(
        sessionId,
      );

    this.conversations.set(
      sessionId,
      conversation,
    );

    return conversation;
  }

  get(
    sessionId: string,
  ): ExecutiveConversation | undefined {
    return this.conversations.get(
      sessionId,
    );
  }

  getOrCreate(
    sessionId: string,
  ): ExecutiveConversation {
    return (
      this.get(sessionId) ??
      this.create(sessionId)
    );
  }

  list():
    readonly ExecutiveConversation[] {
    return Object.freeze(
      Array.from(
        this.conversations.values(),
      ),
    );
  }

  remove(
    sessionId: string,
  ): boolean {
    return this.conversations.delete(
      sessionId,
    );
  }

  clear(): void {
    this.conversations.clear();
  }

  size(): number {
    return this.conversations.size;
  }
}
