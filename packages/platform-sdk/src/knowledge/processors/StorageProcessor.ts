import type {
  KnowledgeObject,
} from "../KnowledgeObject.js";

import type {
  KnowledgeProcessor,
} from "../KnowledgeProcessor.js";

/*
 * Temporary processor.
 *
 * Phase 044 establishes the publication pipeline.
 * Existing recorders remain authoritative until
 * their storage logic is migrated.
 */
export class StorageProcessor
  implements KnowledgeProcessor {

  supports(
    _object: KnowledgeObject,
  ): boolean {
    return true;
  }

  async process(
    _object: KnowledgeObject,
  ): Promise<void> {
    // intentionally empty
  }
}
