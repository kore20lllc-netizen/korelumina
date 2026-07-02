import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgeNormalizer,
} from "./KnowledgeNormalizer.js";

import {
  KnowledgeNormalizationRegistry,
} from "./KnowledgeNormalizationRegistry.js";

export class KnowledgeNormalizationPipeline {
  constructor(
    private readonly registry: KnowledgeNormalizationRegistry,
  ) {}

  async normalize(
    items: readonly KnowledgeIRItem[],
  ): Promise<
    KnowledgeIRItem[]
  > {
    const output: KnowledgeIRItem[] =
      [];

    for (const item of items) {
      output.push(
        await this.normalizeItem(
          item,
        ),
      );
    }

    return output;
  }

  private async normalizeItem(
    item: KnowledgeIRItem,
  ): Promise<
    KnowledgeIRItem
  > {
    let current = item;

    const normalizers =
      this.registry.findSupportingNormalizers(
        current,
      );

    for (const normalizer of normalizers) {
      current =
        await this.apply(
          normalizer,
          current,
        );
    }

    return current;
  }

  private async apply(
    normalizer: KnowledgeNormalizer,
    item: KnowledgeIRItem,
  ): Promise<
    KnowledgeIRItem
  > {
    return normalizer.normalize(
      item,
    );
  }
}
