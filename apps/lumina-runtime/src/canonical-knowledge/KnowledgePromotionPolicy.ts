import type {
  KnowledgeIRItem,
} from "../knowledge-preservation/ir/index.js";

import type {
  CanonicalKnowledgeItem,
} from "./CanonicalKnowledgeItem.js";

export interface PromotionDecision {
  promote: boolean;
  reason?: string;
}

export class KnowledgePromotionPolicy {
  evaluate(
    item: KnowledgeIRItem,
    _existing: readonly CanonicalKnowledgeItem[],
  ): PromotionDecision {
    if (
      item.confidence < 0.5
    ) {
      return {
        promote: false,
        reason: "confidence-below-threshold",
      };
    }

    if (
      item.status ===
      "rejected"
    ) {
      return {
        promote: false,
        reason: "candidate-rejected",
      };
    }

    return {
      promote: true,
    };
  }
}
