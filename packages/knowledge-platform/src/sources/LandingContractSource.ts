import type { KnowledgeSource } from "../ingestion/KnowledgeSource.js";
import type { KnowledgeDocument } from "../types/KnowledgeTypes.js";

export class LandingContractSource implements KnowledgeSource {
  readonly id = "LandingContract";
  readonly name = "LandingContract";

  async scan(): Promise<KnowledgeDocument[]> {
    return [];
  }
}
