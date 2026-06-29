import type { KnowledgeGraph } from "../graph/KnowledgeGraph.js";
import type { KnowledgeNormalizer } from "../normalization/KnowledgeNormalizer.js";
import type { KnowledgeStore } from "../store/KnowledgeStore.js";
import type { KnowledgeRecord } from "../types/KnowledgeTypes.js";
import type { KnowledgeSource } from "./KnowledgeSource.js";

export interface KnowledgeSeederResult {
  scannedDocuments: number;
  storedRecords: number;
  records: KnowledgeRecord[];
}

export class KnowledgeSeeder {
  constructor(
    private readonly sources: KnowledgeSource[],
    private readonly normalizer: KnowledgeNormalizer,
    private readonly store: KnowledgeStore,
    private readonly graph: KnowledgeGraph,
  ) {}

  async seed(): Promise<KnowledgeSeederResult> {
    const records: KnowledgeRecord[] = [];
    let scannedDocuments = 0;

    for (const source of this.sources) {
      const documents = await source.scan();
      scannedDocuments += documents.length;

      for (const document of documents) {
        const record = await this.normalizer.normalize(document);

        await this.store.save(record);
        await this.graph.upsert(record);

        records.push(record);
      }
    }

    return {
      scannedDocuments,
      storedRecords: records.length,
      records,
    };
  }
}
