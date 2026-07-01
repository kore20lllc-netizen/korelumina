import type {
  KnowledgeEvent,
} from "@korelumina/platform-sdk";

export interface EventJournalEntry {
  id: string;

  eventId: string;

  eventType: string;

  objectType: string;

  objectId: string;

  timestamp: number;

  payload: KnowledgeEvent;
}
