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
    const terms =
      query
        .toLowerCase()
        .split(
          /[^a-z0-9]+/,
        )
        .map(
          (term) =>
            term.trim(),
        )
        .filter(
          (term) =>
            term.length >= 4,
        );

    if (
      terms.length === 0
    ) {
      return this.store.list();
    }

    return this.store
      .list()
      .map(
        (item) => {
          const searchable =
            [
              item.title,
              item.summary,
              item.type,
            ]
              .join(
                " ",
              )
              .toLowerCase();

          const score =
            terms.reduce(
              (
                total,
                term,
              ) =>
                searchable.includes(
                  term,
                )
                  ? total + 1
                  : total,
              0,
            );

          return {
            item,
            score,
          };
        },
      )
      .filter(
        (entry) =>
          entry.score > 0,
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.score -
          left.score,
      )
      .map(
        (entry) =>
          entry.item,
      );
  }

  size(): number {
    return this.store.size();
  }
}
