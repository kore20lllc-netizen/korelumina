import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  KnowledgePlatform,
} from "../KnowledgePlatform.js";

import type {
  AgentContextRequest,
} from "./AgentContextRequest.js";

export interface KnowledgeContext {
  generatedAt: number;
  request: AgentContextRequest;
  knowledge: CanonicalKnowledgeItem[];
}

export class KnowledgeContextBuilder {
  constructor(
    private readonly platform: KnowledgePlatform,
  ) {}

  build(
    request: AgentContextRequest,
  ): KnowledgeContext {
    const knowledge =
      request.query
        ? this.platform.search(
            request.query,
          )
        : this.platform.list();

    const max =
      request.maxKnowledgeItems ??
      knowledge.length;

    return {
      generatedAt:
        Date.now(),

      request,

      knowledge:
        knowledge.slice(
          0,
          max,
        ),
    };
  }
}
