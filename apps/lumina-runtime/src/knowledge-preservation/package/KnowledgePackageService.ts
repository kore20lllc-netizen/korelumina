import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgePackage,
} from "./KnowledgePackage.js";

import {
  KnowledgePackageFactory,
} from "./KnowledgePackageFactory.js";

import {
  KnowledgePackageRegistry,
} from "./KnowledgePackageRegistry.js";

import {
  loadKnowledgePackage,
  saveKnowledgePackage,
  listKnowledgePackages,
} from "./KnowledgePackageStore.js";

export class KnowledgePackageService {
  readonly registry =
    new KnowledgePackageRegistry();

  private readonly factory =
    new KnowledgePackageFactory();

  packageValidated(
    items: readonly KnowledgeIRItem[],
  ): KnowledgePackage | undefined {
    if (
      items.length === 0
    ) {
      return undefined;
    }

    const knowledgePackage =
      this.factory.createAwaitingReview(
        items,
      );

    this.registry.register(
      knowledgePackage,
    );

    saveKnowledgePackage(
      knowledgePackage,
    );

    return knowledgePackage;
  }

  get(
    id: string,
  ): KnowledgePackage | undefined {
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
      loadKnowledgePackage(
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

  list(): KnowledgePackage[] {
    const persisted =
      listKnowledgePackages();

    for (
      const knowledgePackage
      of persisted
    ) {
      this.registry.register(
        knowledgePackage,
      );
    }

    return this.registry.list();
  }
}
