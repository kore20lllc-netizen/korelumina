import type {
  KnowledgeIRItem,
} from "../knowledge-preservation/ir/index.js";

import type {
  CanonicalKnowledgeItem,
} from "./CanonicalKnowledgeItem.js";

export class KnowledgePromoter {
  promote(
    item: KnowledgeIRItem,
  ): CanonicalKnowledgeItem {
    const now =
      Date.now();

    return {
      id:
        `canonical:${item.id}`,

      type:
        item.candidateType,

      title:
        item.title,

      summary:
        item.summary,

      confidence:
        item.confidence,

      evidenceRefs:
        item.evidenceRefs,

      relationships:
        item.proposedRelationships,

      createdAt:
        now,

      updatedAt:
        now,

      status:
        "canonical",

      metadata:
        item.metadata,
    };
  }
}
