import {
  DocumentationEvidenceDiscovery,
} from "../discovery/index.js";

import {
  createKnowledgePreservationPlatform,
} from "../bootstrap/index.js";

import type {
  KnowledgeIRItem,
} from "../ir/index.js";

export class DocumentationKnowledgeRecovery {
  private readonly discovery =
    new DocumentationEvidenceDiscovery();

  private readonly platform =
    createKnowledgePreservationPlatform();

  async recover(
    repositoryRoot: string,
  ): Promise<
    KnowledgeIRItem[]
  > {
    const recovered: KnowledgeIRItem[] =
      [];

    const evidence =
      this.discovery.discover(
        repositoryRoot,
      );

    for (const item of evidence) {
      const compiled =
        await this.platform
          .compilerPipeline
          .compile(
            item,
          );

      const normalized =
        await this.platform
          .normalizationPipeline
          .normalize(
            compiled,
          );

      const validated =
        await this.platform
          .validationPipeline
          .validate(
            normalized,
          );

      await this.platform
        .publishingPipeline
        .publish(
          validated,
        );

      recovered.push(
        ...validated,
      );
    }

    return recovered;
  }
}
