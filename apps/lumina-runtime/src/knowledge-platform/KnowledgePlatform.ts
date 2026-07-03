import type {
  KnowledgeIRItem,
} from "../knowledge-preservation/ir/index.js";

import type {
  CanonicalKnowledgeItem,
} from "../canonical-knowledge/index.js";

import {
  CanonicalKnowledgeStore,
} from "../canonical-knowledge/index.js";

import {
  CanonicalKnowledgeQueryService,
} from "../canonical-knowledge/index.js";

export class KnowledgePlatform {
  readonly store =
    new CanonicalKnowledgeStore();

  readonly query =
    new CanonicalKnowledgeQueryService(
      this.store,
    );

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
