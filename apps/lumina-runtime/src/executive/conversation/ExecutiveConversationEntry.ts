export type ExecutiveConversationEntryType =
  | "message"
  | "question"
  | "answer"
  | "recommendation"
  | "decision"
  | "approval"
  | "system";

export interface ExecutiveConversationEntry {
  readonly id: string;
  readonly sessionId: string;
  readonly authorId: string;
  readonly type: ExecutiveConversationEntryType;
  readonly content: string;
  readonly createdAt: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface CreateExecutiveConversationEntryInput {
  id: string;
  sessionId: string;
  authorId: string;
  type: ExecutiveConversationEntryType;
  content: string;
  createdAt?: number;
  metadata?: Readonly<Record<string, unknown>>;
}

export function createExecutiveConversationEntry(
  input: CreateExecutiveConversationEntryInput,
): ExecutiveConversationEntry {
  return Object.freeze({
    id: input.id.trim(),
    sessionId: input.sessionId.trim(),
    authorId: input.authorId.trim(),
    type: input.type,
    content: input.content.trim(),
    createdAt: input.createdAt ?? Date.now(),
    metadata: Object.freeze({
      ...(input.metadata ?? {}),
    }),
  });
}
