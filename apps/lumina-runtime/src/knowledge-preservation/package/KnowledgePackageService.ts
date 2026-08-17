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

  markAdapted(
    id: string,
    organizationalMemoryRecordIds:
      readonly string[],
  ): KnowledgePackage {
    const knowledgePackage =
      this.get(
        id,
      );

    if (
      !knowledgePackage
    ) {
      throw new Error(
        "knowledge_package_not_found",
      );
    }

    if (
      knowledgePackage.state !==
      "canonical"
    ) {
      throw new Error(
        "knowledge_package_not_canonical",
      );
    }

    const now =
      Date.now();

    const updated:
      KnowledgePackage = {
        ...knowledgePackage,

        state:
          "adapted",

        updatedAt:
          now,

        lifecycleHistory: [
          ...knowledgePackage
            .lifecycleHistory,
          {
            state:
              "adapted",

            at:
              now,

            reason:
              "organizational_memory_adapted",
          },
        ],

        metadata: {
          ...knowledgePackage.metadata,

          organizationalMemoryAdaptation: {
            adaptedAt:
              now,

            recordIds: [
              ...organizationalMemoryRecordIds,
            ],
          },
        },
      };

    this.registry.register(
      updated,
    );

    saveKnowledgePackage(
      updated,
    );

    return updated;
  }

  list(): KnowledgePackage[] {
    const persisted =
      listKnowledgePackages();

    /*
     * Persistence is the runtime source of truth.
     *
     * The registry is an in-process acceleration layer only.
     * Reconcile it from persisted state on every authoritative
     * list read so packages removed from operational storage do
     * not remain visible as stale runtime knowledge.
     */
    this.registry.clear();

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
