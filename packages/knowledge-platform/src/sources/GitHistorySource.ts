import type { KnowledgeSource } from "../ingestion/KnowledgeSource.js";
import type { KnowledgeDocument } from "../types/KnowledgeTypes.js";

export class GitHistorySource implements KnowledgeSource {
  readonly id = "GitHistory";
  readonly name = "GitHistory";

  async scan(): Promise<KnowledgeDocument[]> {
    return [];
  }
}
