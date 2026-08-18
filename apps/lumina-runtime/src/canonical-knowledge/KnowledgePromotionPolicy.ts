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
    _item: KnowledgeIRItem,
    _existing: readonly CanonicalKnowledgeItem[],
  ): PromotionDecision {
    return {
      promote: false,
      reason: "governed-approval-required",
    };
  }
}
