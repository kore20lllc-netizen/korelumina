import type {
  KnowledgeEvent,
} from "./KnowledgeEvent.js";

export interface KnowledgeSubscriber {
  supports(
    event: KnowledgeEvent,
  ): boolean;

  handle(
    event: KnowledgeEvent,
  ): Promise<void>;
}
