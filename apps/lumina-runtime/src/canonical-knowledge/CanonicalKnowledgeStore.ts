import type {
  KnowledgeIRItem,
} from "../knowledge-preservation/ir/index.js";

import type {
  CanonicalKnowledgeItem,
} from "./CanonicalKnowledgeItem.js";

import {
  CanonicalKnowledgePersistence,
  type CanonicalKnowledgePersistenceOptions,
} from "./CanonicalKnowledgePersistence.js";

import {
  CanonicalKnowledgeRegistry,
} from "./CanonicalKnowledgeRegistry.js";

import {
  KnowledgePromoter,
} from "./KnowledgePromoter.js";

import {
  KnowledgePromotionPolicy,
} from "./KnowledgePromotionPolicy.js";


export interface CanonicalKnowledgeStoreOptions
  extends CanonicalKnowledgePersistenceOptions {}


export class CanonicalKnowledgeStore {
  private readonly promoter =
    new KnowledgePromoter();

  private readonly registry =
    new CanonicalKnowledgeRegistry();

  private readonly persistence:
    CanonicalKnowledgePersistence;

  private readonly policy =
    new KnowledgePromotionPolicy();


  constructor(
    options:
      CanonicalKnowledgeStoreOptions = {},
  ) {
    this.persistence =
      new CanonicalKnowledgePersistence(
        options,
      );

    for (
      const item
      of this.persistence.list()
    ) {
      this.registry.register(
        item,
      );
    }
  }


  promote(
    item:
      KnowledgeIRItem,
  ):
    CanonicalKnowledgeItem |
    undefined {
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

    this.registerGoverned(
      canonical,
    );

    return canonical;
  }


  promoteAll(
    items:
      readonly KnowledgeIRItem[],
  ): CanonicalKnowledgeItem[] {
    const promoted:
      CanonicalKnowledgeItem[] =
        [];

    for (
      const item
      of items
    ) {
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


  registerGoverned(
    item:
      CanonicalKnowledgeItem,
  ): CanonicalKnowledgeItem {
    this.persistence.save(
      item,
    );

    this.registry.register(
      item,
    );

    return item;
  }


  get(
    id:
      string,
  ):
    CanonicalKnowledgeItem |
    undefined {
    const registered =
      this.registry.get(
        id,
      );

    if (
      registered
    ) {
      return registered;
    }

    const persisted =
      this.persistence.get(
        id,
      );

    if (
      !persisted
    ) {
      return undefined;
    }

    this.registry.register(
      persisted,
    );

    return persisted;
  }


  list():
    CanonicalKnowledgeItem[] {
    return this.registry.list();
  }


  size(): number {
    return this.registry.size();
  }


  clear(): void {
    /*
     * clear() retains its historical meaning:
     * clear the in-memory view only.
     *
     * Durable canonical knowledge is governance state and must
     * never be deleted as an incidental cache-reset operation.
     */
    this.registry.clear();
  }
}
