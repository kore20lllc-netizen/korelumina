import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgeNormalizer,
} from "./KnowledgeNormalizer.js";

export class KnowledgeNormalizationRegistry {
  private readonly normalizers =
    new Map<
      string,
      KnowledgeNormalizer
    >();

  register(
    normalizer: KnowledgeNormalizer,
  ): void {
    const key =
      this.normalizerKey(
        normalizer,
      );

    if (
      this.normalizers.has(
        key,
      )
    ) {
      throw new Error(
        `Knowledge normalizer already registered: ${key}`,
      );
    }

    this.normalizers.set(
      key,
      normalizer,
    );
  }

  list(): KnowledgeNormalizer[] {
    return [
      ...this.normalizers.values(),
    ];
  }

  findSupportingNormalizers(
    item: KnowledgeIRItem,
  ): KnowledgeNormalizer[] {
    return this.list().filter(
      (normalizer) =>
        normalizer.supports(
          item,
        ),
    );
  }

  clear(): void {
    this.normalizers.clear();
  }

  private normalizerKey(
    normalizer: KnowledgeNormalizer,
  ): string {
    return `${normalizer.name}@${normalizer.version}`;
  }
}
