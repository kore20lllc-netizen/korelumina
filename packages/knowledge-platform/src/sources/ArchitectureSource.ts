import type { KnowledgeSource } from "../ingestion/KnowledgeSource.js";
import type { KnowledgeDocument } from "../types/KnowledgeTypes.js";

export class ArchitectureSource implements KnowledgeSource {
  readonly id = "Architecture";
  readonly name = "Architecture";

  async scan(): Promise<KnowledgeDocument[]> {
    return [];
  }
}
