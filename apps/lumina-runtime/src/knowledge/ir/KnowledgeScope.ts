export type KnowledgeScopeType =
  | "platform"
  | "organization"
  | "team"
  | "project"
  | "session"
  | "task"
  | "conversation";

export interface KnowledgeScope {
  type: KnowledgeScopeType;
  id: string;
}
