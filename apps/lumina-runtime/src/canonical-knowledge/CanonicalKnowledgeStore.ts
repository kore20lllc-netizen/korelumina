import type {
  KnowledgeIRItem,
} from "../knowledge-preservation/ir/index.js";

import type {
  CanonicalKnowledgeItem,
} from "./CanonicalKnowledgeItem.js";

import {
  CanonicalKnowledgeRegistry,
} from "./CanonicalKnowledgeRegistry.js";

import {
  KnowledgePromoter,
} from "./KnowledgePromoter.js";

import {
  KnowledgePromotionPolicy,
} from "./KnowledgePromotionPolicy.js";

export class CanonicalKnowledgeStore {
  private readonly promoter =
    new KnowledgePromoter();

  private readonly registry =
    new CanonicalKnowledgeRegistry();

  private readonly policy =
    new KnowledgePromotionPolicy();

  promote(
    item: KnowledgeIRItem,
  ): CanonicalKnowledgeItem | undefined {
    const decision =
      this.policy.evaluate(
        item,
        this.registry.list(),
      );

    if (
      !decision.promote
    ) {
      return undefined;
    }

    const canonical =
      this.promoter.promote(
        item,
      );

    this.registry.register(
      canonical,
    );

    return canonical;
  }

  promoteAll(
    items: readonly KnowledgeIRItem[],
  ): CanonicalKnowledgeItem[] {
    const promoted: CanonicalKnowledgeItem[] =
      [];

    for (const item of items) {
      const canonical =
        this.promote(
          item,
        );

      if (
        canonical
      ) {
        promoted.push(
          canonical,
        );
      }
    }

    return promoted;
  }

  get(
    id: string,
  ): CanonicalKnowledgeItem | undefined {
    return this.registry.get(
      id,
    );
  }

  list(): CanonicalKnowledgeItem[] {
    return this.registry.list();
  }

  size(): number {
    return this.registry.size();
  }

  clear(): void {
    this.registry.clear();
  }
}
