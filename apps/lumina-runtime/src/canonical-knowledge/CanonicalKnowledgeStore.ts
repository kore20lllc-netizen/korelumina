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

export class CanonicalKnowledgeStore {
  private readonly promoter =
    new KnowledgePromoter();

  private readonly registry =
    new CanonicalKnowledgeRegistry();

  promote(
    item: KnowledgeIRItem,
  ): CanonicalKnowledgeItem {
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
    return items.map(
      (item) =>
        this.promote(
          item,
        ),
    );
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
