import type {
  KnowledgePackage,
} from "./KnowledgePackage.js";

export class KnowledgePackageRegistry {
  private readonly packages =
    new Map<
      string,
      KnowledgePackage
    >();

  register(
    knowledgePackage:
      KnowledgePackage,
  ): void {
    this.packages.set(
      knowledgePackage.id,
      knowledgePackage,
    );
  }

  has(
    id: string,
  ): boolean {
    return this.packages.has(
      id,
    );
  }

  get(
    id: string,
  ): KnowledgePackage | undefined {
    return this.packages.get(
      id,
    );
  }

  list(): KnowledgePackage[] {
    return [
      ...this.packages.values(),
    ];
  }

  size(): number {
    return this.packages.size;
  }

  clear(): void {
    this.packages.clear();
  }
}
