import type {
  CanonicalKnowledgeItem,
} from "./CanonicalKnowledgeItem.js";

import {
  CanonicalKnowledgeStore,
} from "./CanonicalKnowledgeStore.js";

export class CanonicalKnowledgeQueryService {
  constructor(
    private readonly store: CanonicalKnowledgeStore,
  ) {}

  get(
    id: string,
  ): CanonicalKnowledgeItem | undefined {
    return this.store.get(
      id,
    );
  }

  list(): CanonicalKnowledgeItem[] {
    return this.store.list();
  }

  findByType(
    type: CanonicalKnowledgeItem["type"],
  ): CanonicalKnowledgeItem[] {
    return this.store
      .list()
      .filter(
        (item) =>
          item.type ===
          type,
      );
  }

  search(
    query: string,
  ): CanonicalKnowledgeItem[] {
    const normalized =
      query.toLowerCase();

    return this.store
      .list()
      .filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(
              normalized,
            ) ||
          item.summary
            .toLowerCase()
            .includes(
              normalized,
            ),
      );
  }

  size(): number {
    return this.store.size();
  }
}
