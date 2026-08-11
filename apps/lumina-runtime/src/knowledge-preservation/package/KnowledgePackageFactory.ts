import {
  createHash,
} from "node:crypto";

import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgePackage,
} from "./KnowledgePackage.js";

function packageIdentity(
  items: readonly KnowledgeIRItem[],
): string {
  const identityMaterial =
    items
      .map(
        (item) =>
          [
            item.id,
            ...item.evidenceRefs,
          ].join(":"),
      )
      .sort()
      .join("|");

  const digest =
    createHash("sha256")
      .update(identityMaterial)
      .digest("hex")
      .slice(0, 16);

  return `knowledge-package:${digest}`;
}

export class KnowledgePackageFactory {
  createAwaitingReview(
    items: readonly KnowledgeIRItem[],
  ): KnowledgePackage {
    const now =
      Date.now();

    return {
      id: packageIdentity(
        items,
      ),

      state:
        "awaiting_review",

      sourceEvidenceRefs: [
        ...new Set(
          items.flatMap(
            (item) =>
              item.evidenceRefs,
          ),
        ),
      ],

      knowledgeItemIds:
        items.map(
          (item) =>
            item.id,
        ),

      items: [
        ...items,
      ],

      createdAt:
        now,

      updatedAt:
        now,

      metadata: {},
    };
  }
}
