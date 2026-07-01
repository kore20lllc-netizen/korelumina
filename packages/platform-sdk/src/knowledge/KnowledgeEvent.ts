import type {
  KnowledgeObject,
} from "./KnowledgeObject.js";

export type KnowledgeEventType =
  | "knowledge.published"
  | "knowledge.failed";

export interface KnowledgeEvent {
  id: string;

  type: KnowledgeEventType;

  object: KnowledgeObject;

  timestamp: number;

  metadata: Record<
    string,
    unknown
  >;
}
