import type {
  CanonicalKnowledgeItem,
} from "./CanonicalKnowledgeItem.js";

export class CanonicalKnowledgeRegistry {
  private readonly items =
    new Map<
      string,
      CanonicalKnowledgeItem
    >();

  register(
    item: CanonicalKnowledgeItem,
  ): void {
    this.items.set(
      item.id,
      item,
    );
  }

  has(
    id: string,
  ): boolean {
    return this.items.has(
      id,
    );
  }

  get(
    id: string,
  ): CanonicalKnowledgeItem | undefined {
    return this.items.get(
      id,
    );
  }

  list(): CanonicalKnowledgeItem[] {
    return [
      ...this.items.values(),
    ];
  }

  remove(
    id: string,
  ): boolean {
    return this.items.delete(
      id,
    );
  }

  clear(): void {
    this.items.clear();
  }

  size(): number {
    return this.items.size;
  }
}
