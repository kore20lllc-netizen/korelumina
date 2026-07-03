import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  KnowledgePlatform,
} from "../KnowledgePlatform.js";

export interface KnowledgeContext {
  generatedAt: number;
  knowledge: CanonicalKnowledgeItem[];
}

export class KnowledgeContextBuilder {
  constructor(
    private readonly platform: KnowledgePlatform,
  ) {}

  build(): KnowledgeContext {
    return {
      generatedAt:
        Date.now(),
      knowledge:
        this.platform.list(),
    };
  }

  buildByQuery(
    query: string,
  ): KnowledgeContext {
    return {
      generatedAt:
        Date.now(),
      knowledge:
        this.platform.search(
          query,
        ),
    };
  }
}
