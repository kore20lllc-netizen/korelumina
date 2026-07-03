import type {
  EvidenceItem,
} from "../evidence/index.js";

import {
  KnowledgeCompilerRegistry,
  KnowledgeCompilerPipeline,
} from "../compiler/index.js";

import {
  KnowledgeNormalizationPipeline,
  KnowledgeNormalizationRegistry,
} from "../normalization/index.js";

import {
  KnowledgeValidationPipeline,
  KnowledgeValidationRegistry,
} from "../validation/index.js";

import {
  KnowledgePublisherRegistry,
  KnowledgePublishingPipeline,
} from "../publisher/index.js";

export class KnowledgePreservationPlatform {
  readonly compilerRegistry =
    new KnowledgeCompilerRegistry();

  readonly normalizationRegistry =
    new KnowledgeNormalizationRegistry();

  readonly validationRegistry =
    new KnowledgeValidationRegistry();

  readonly publisherRegistry =
    new KnowledgePublisherRegistry();

  readonly compilerPipeline =
    new KnowledgeCompilerPipeline(
      this.compilerRegistry,
    );

  readonly normalizationPipeline =
    new KnowledgeNormalizationPipeline(
      this.normalizationRegistry,
    );

  readonly validationPipeline =
    new KnowledgeValidationPipeline(
      this.validationRegistry,
    );

  readonly publishingPipeline =
    new KnowledgePublishingPipeline(
      this.publisherRegistry,
    );

  async preserve(
    evidence: EvidenceItem,
  ): Promise<void> {
    const compiled =
      await this.compilerPipeline.compile(
        evidence,
      );

    const normalized =
      await this.normalizationPipeline.normalize(
        compiled,
      );

    const validated =
      await this.validationPipeline.validate(
        normalized,
      );

    await this.publishingPipeline.publish(
      validated,
    );
  }
}
