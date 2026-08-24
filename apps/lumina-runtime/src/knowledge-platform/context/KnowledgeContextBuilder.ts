import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryInsight,
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/index.js";

import {
  runOrganizationalMemoryPipeline,
} from "../../knowledge/organizational-memory/index.js";

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

export interface OrganizationalMemoryContext {
  records: OrganizationalMemoryRecord[];
  insights: OrganizationalMemoryInsight[];
}

export interface KnowledgeContextWithOrganizationalMemory
  extends KnowledgeContext {
  organizationalMemory:
    OrganizationalMemoryContext;
}

export interface KnowledgeContextCanonicalConsumptionView {
  list():
    CanonicalKnowledgeItem[];
}


export class KnowledgeContextBuilder {
  constructor(
    private readonly platform:
      KnowledgePlatform,

    private readonly canonicalConsumptionView?:
      KnowledgeContextCanonicalConsumptionView,
  ) {}

  build(
    request: AgentContextRequest,
  ): KnowledgeContext {
    const currentPolicyKnowledge =
      this.canonicalConsumptionView
        ?.list();

    const allowedCanonicalIds =
      currentPolicyKnowledge
        ? new Set(
            currentPolicyKnowledge.map(
              item =>
                item.id,
            ),
          )
        : null;

    const knowledge =
      request.query
        ? this.platform
            .search(
              request.query,
            )
            .filter(
              item =>
                allowedCanonicalIds ===
                  null ||
                allowedCanonicalIds.has(
                  item.id,
                ),
            )
        : currentPolicyKnowledge ??
          this.platform.list();

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

  async buildWithOrganizationalMemory(
    request: AgentContextRequest,
  ): Promise<
    KnowledgeContextWithOrganizationalMemory
  > {
    const context =
      this.build(
        request,
      );

    if (
      !request.organizationId
    ) {
      return {
        ...context,

        organizationalMemory: {
          records: [],
          insights: [],
        },
      };
    }

    const memory =
      await runOrganizationalMemoryPipeline({
        requestId:
          `agent-context:${context.generatedAt}`,

        organizationId:
          request.organizationId,

        projectIds:
          request.projectIds ?? [],

        teamIds:
          request.teamIds ?? [],

        query:
          request.query ??
          request.objective,

        references:
          request.references ??
          context.knowledge.map(
            (item) =>
              item.id,
          ),
      });

    return {
      ...context,

      organizationalMemory: {
        records:
          memory.records,

        insights:
          memory.insights,
      },
    };
  }
}
