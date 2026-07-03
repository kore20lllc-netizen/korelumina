import type {
  EvidenceItem,
} from "../evidence/index.js";

import {
  KnowledgeCompilerPipeline,
  KnowledgeCompilerRegistry,
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

import {
  CanonicalKnowledgeStore,
} from "../../canonical-knowledge/index.js";

export class KnowledgePreservationPlatform {
  readonly compilerRegistry =
    new KnowledgeCompilerRegistry();

  readonly normalizationRegistry =
    new KnowledgeNormalizationRegistry();

  readonly validationRegistry =
    new KnowledgeValidationRegistry();

  readonly publisherRegistry =
    new KnowledgePublisherRegistry();

  readonly canonicalKnowledgeStore =
    new CanonicalKnowledgeStore();

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

    this.canonicalKnowledgeStore.promoteAll(
      validated,
    );

    await this.publishingPipeline.publish(
      validated,
    );
  }
}
