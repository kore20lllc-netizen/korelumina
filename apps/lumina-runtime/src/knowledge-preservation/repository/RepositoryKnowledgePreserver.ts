import {
  RepositoryEvidenceDiscovery,
} from "../discovery/index.js";

import {
  createKnowledgePreservationPlatform,
} from "../bootstrap/index.js";

export class RepositoryKnowledgePreserver {
  private readonly discovery =
    new RepositoryEvidenceDiscovery();

  private readonly platform =
    createKnowledgePreservationPlatform();

  async preserveRepository(
    repositoryRoot: string,
  ): Promise<void> {
    const evidence =
      this.discovery.discover(
        repositoryRoot,
      );

    for (const item of evidence) {
      await this.platform.preserve(
        item,
      );
    }
  }
}
