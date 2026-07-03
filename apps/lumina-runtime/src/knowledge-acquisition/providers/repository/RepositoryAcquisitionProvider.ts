import type {
  EvidenceItem,
} from "../../../knowledge-preservation/evidence/index.js";

import {
  DocumentationEvidenceDiscovery,
  RepositoryEvidenceDiscovery,
} from "../../../knowledge-preservation/discovery/index.js";

import type {
  KnowledgeAcquisitionProvider,
  KnowledgeAcquisitionProviderMetadata,
} from "../../KnowledgeAcquisitionProvider.js";

export class RepositoryAcquisitionProvider
  implements KnowledgeAcquisitionProvider
{
  readonly metadata: KnowledgeAcquisitionProviderMetadata =
    {
      name: "repository-acquisition-provider",
      version: "1.0.0",
      sourceType: "repository",
    };

  private discoveredEvidence: EvidenceItem[] =
    [];

  private readonly repositoryDiscovery =
    new RepositoryEvidenceDiscovery();

  private readonly documentationDiscovery =
    new DocumentationEvidenceDiscovery();

  constructor(
    private readonly repositoryRoot: string,
  ) {}

  async discover(): Promise<void> {
    const repositoryEvidence =
      this.repositoryDiscovery.discover(
        this.repositoryRoot,
      );

    const documentationEvidence =
      this.documentationDiscovery.discover(
        this.repositoryRoot,
      );

    this.discoveredEvidence =
      this.mergeEvidence(
        repositoryEvidence,
        documentationEvidence,
      );
  }

  async collect(): Promise<readonly EvidenceItem[]> {
    return this.discoveredEvidence;
  }

  async emitEvidence(): Promise<readonly EvidenceItem[]> {
    return this.discoveredEvidence;
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
