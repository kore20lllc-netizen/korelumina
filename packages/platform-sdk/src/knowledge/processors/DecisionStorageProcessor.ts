import type {
  KnowledgeObject,
} from "../KnowledgeObject.js";

import type {
  KnowledgeProcessor,
} from "../KnowledgeProcessor.js";

export class DecisionStorageProcessor
  implements KnowledgeProcessor {

  supports(
    object: KnowledgeObject,
  ): boolean {
    return (
      object.type ===
      "decision"
    );
  }

  async process(
    _object: KnowledgeObject,
  ): Promise<void> {
    /*
     * Phase 045:
     *
     * Runtime storage remains the
     * source of truth.
     *
     * This processor establishes the
     * publication path only.
     */
  }
}
