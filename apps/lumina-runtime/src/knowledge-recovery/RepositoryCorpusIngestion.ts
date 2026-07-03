import {
  DocumentationEvidenceDiscovery,
  RepositoryEvidenceDiscovery,
} from "../knowledge-preservation/discovery/index.js";

import {
  runtimeKnowledgeProvider,
} from "../knowledge-platform/runtime/index.js";

import type {
  EvidenceItem,
} from "../knowledge-preservation/evidence/index.js";

export interface RepositoryCorpusReport {
  repositoryEvidence: number;
  documentationEvidence: number;
  processedEvidence: number;
}

export class RepositoryCorpusIngestion {
  private readonly repositoryDiscovery =
    new RepositoryEvidenceDiscovery();

  private readonly documentationDiscovery =
    new DocumentationEvidenceDiscovery();

  async ingest(
    repositoryRoot: string,
  ): Promise<
    RepositoryCorpusReport
  > {
    const repositoryEvidence =
      this.repositoryDiscovery.discover(
        repositoryRoot,
      );

    const documentationEvidence =
      this.documentationDiscovery.discover(
        repositoryRoot,
      );

    const evidence =
      this.mergeEvidence(
        repositoryEvidence,
        documentationEvidence,
      );

    const platform =
      runtimeKnowledgeProvider
        .getPlatform();

    for (const item of evidence) {
      await platform.preserve(
        item,
      );
    }

    return {
      repositoryEvidence:
        repositoryEvidence.length,

      documentationEvidence:
        documentationEvidence.length,

      processedEvidence:
        evidence.length,
    };
  }

  private mergeEvidence(
    repositoryEvidence: readonly EvidenceItem[],
    documentationEvidence: readonly EvidenceItem[],
  ): EvidenceItem[] {
    const merged =
      new Map<
        string,
        EvidenceItem
      >();

    for (const item of repositoryEvidence) {
      merged.set(
        item.id,
        item,
      );
    }

    for (const item of documentationEvidence) {
      merged.set(
        item.id,
        item,
      );
    }

    return [
      ...merged.values(),
    ];
  }
}
