import type { KnowledgeSource } from "../ingestion/KnowledgeSource.js";
import type { KnowledgeDocument } from "../types/KnowledgeTypes.js";

export class HistoricalDocsSource implements KnowledgeSource {
  readonly id = "HistoricalDocs";
  readonly name = "HistoricalDocs";

  async scan(): Promise<KnowledgeDocument[]> {
    return [];
  }
}
