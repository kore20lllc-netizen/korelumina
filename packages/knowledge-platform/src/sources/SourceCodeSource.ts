import type { KnowledgeSource } from "../ingestion/KnowledgeSource.js";
import type { KnowledgeDocument } from "../types/KnowledgeTypes.js";

export class SourceCodeSource implements KnowledgeSource {
  readonly id = "SourceCode";
  readonly name = "SourceCode";

  async scan(): Promise<KnowledgeDocument[]> {
    return [];
  }
}
