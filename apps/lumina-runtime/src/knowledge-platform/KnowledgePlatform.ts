import type {
  EvidenceItem,
} from "../knowledge-preservation/evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../knowledge-preservation/ir/index.js";

import type {
  CanonicalKnowledgeItem,
} from "../canonical-knowledge/index.js";

import {
  KnowledgePackageService,
} from "../knowledge-preservation/package/index.js";

import {
  CanonicalKnowledgeStore,
  CanonicalKnowledgeQueryService,
} from "../canonical-knowledge/index.js";

import {
  KnowledgeCompilerRegistry,
  KnowledgeCompilerPipeline,
} from "../knowledge-preservation/compiler/index.js";

import {
  KnowledgeNormalizationRegistry,
  KnowledgeNormalizationPipeline,
} from "../knowledge-preservation/normalization/index.js";

import {
  KnowledgeValidationRegistry,
  KnowledgeValidationPipeline,
} from "../knowledge-preservation/validation/index.js";

import {
  KnowledgePublisherRegistry,
  KnowledgePublishingPipeline,
} from "../knowledge-preservation/publisher/index.js";

export class KnowledgePlatform {
  readonly compilerRegistry =
    new KnowledgeCompilerRegistry();

  readonly normalizationRegistry =
    new KnowledgeNormalizationRegistry();

  readonly validationRegistry =
    new KnowledgeValidationRegistry();

  readonly publisherRegistry =
    new KnowledgePublisherRegistry();

  readonly packageService =
    new KnowledgePackageService();

  readonly store =
    new CanonicalKnowledgeStore();

  readonly query =
    new CanonicalKnowledgeQueryService(
      this.store,
    );

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

    this.packageService.packageValidated(
      validated,
    );

    await this.publishingPipeline.publish(
      validated,
    );
  }

  promote(
    items: readonly KnowledgeIRItem[],
  ): CanonicalKnowledgeItem[] {
    return this.store.promoteAll(
      items,
    );
  }

  search(
    query: string,
  ): CanonicalKnowledgeItem[] {
    return this.query.search(
      query,
    );
  }

  list(): CanonicalKnowledgeItem[] {
    return this.query.list();
  }
}
