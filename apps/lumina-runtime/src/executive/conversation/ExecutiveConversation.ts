import type {
  ExecutiveConversationEntry,
} from "./ExecutiveConversationEntry.js";

export interface ExecutiveConversationSnapshot {
  readonly sessionId: string;
  readonly entries: readonly ExecutiveConversationEntry[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

export class ExecutiveConversation {
  private snapshot: ExecutiveConversationSnapshot;

  constructor(
    sessionId: string,
  ) {
    const now = Date.now();

    this.snapshot = Object.freeze({
      sessionId,
      entries: Object.freeze([]),
      createdAt: now,
      updatedAt: now,
    });
  }

  append(
    entry: ExecutiveConversationEntry,
  ): void {
    this.snapshot = Object.freeze({
      ...this.snapshot,
      entries: Object.freeze([
        ...this.snapshot.entries,
        entry,
      ]),
      updatedAt: Date.now(),
    });
  }

  latest():
    | ExecutiveConversationEntry
    | undefined {
    return this.snapshot.entries.at(-1);
  }

  entries():
    readonly ExecutiveConversationEntry[] {
    return this.snapshot.entries;
  }

  snapshotState():
    ExecutiveConversationSnapshot {
    return this.snapshot;
  }

  size(): number {
    return this.snapshot.entries.length;
  }

  isEmpty(): boolean {
    return this.snapshot.entries.length === 0;
  }
}
