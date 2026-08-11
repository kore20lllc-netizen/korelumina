import type {
  ExecutiveContext,
  ExecutiveContextReference,
} from "./ExecutiveContext.js";

import type {
  ExecutiveEvent,
} from "../events/index.js";

import {
  DefaultExecutiveContextReducer,
} from "../orchestrator/ExecutivePipeline.js";

import type {
  KnowledgeContextBuilder,
  KnowledgeContextWithOrganizationalMemory,
} from "../../knowledge-platform/context/index.js";

function createKnowledgeStateReference(
  context:
    KnowledgeContextWithOrganizationalMemory,
): ExecutiveContextReference {
  return {
    id:
      `knowledge-context:${context.generatedAt}`,

    label:
      "Chief Agent Knowledge Context",

    metadata: {
      generatedAt:
        context.generatedAt,

      role:
        context.request.role,

      objective:
        context.request.objective,

      canonicalKnowledgeIds:
        context.knowledge.map(
          (item) =>
            item.id,
        ),

      organizationalMemoryRecordIds:
        context.organizationalMemory.records.map(
          (record) =>
            record.id,
        ),

      organizationalMemoryInsightIds:
        context.organizationalMemory.insights.map(
          (insight) =>
            insight.id,
        ),
    },
  };
}

export class ExecutiveKnowledgeContextReducer {
  private readonly structuralReducer =
    new DefaultExecutiveContextReducer();

  constructor(
    private readonly knowledgeContextBuilder:
      KnowledgeContextBuilder,
  ) {}

  async reduce(
    current:
      ExecutiveContext,

    event:
      ExecutiveEvent,
  ): Promise<ExecutiveContext> {
    const structuralContext =
      this.structuralReducer.reduce(
        current,
        event,
      );

    if (
      event.actor.type !==
      "chief-agent"
    ) {
      return structuralContext;
    }

    const organizationId =
      structuralContext.organizationId;

    const knowledgeContext =
      await this.knowledgeContextBuilder
        .buildWithOrganizationalMemory({
          role:
            "architect",

          objective:
            event.type,

          query:
            typeof event.payload.query ===
            "string"
              ? event.payload.query
              : undefined,

          organizationId,

          projectIds:
            structuralContext.project
              ? [
                  structuralContext
                    .project
                    .id,
                ]
              : [],

          references:
            event.evidence.map(
              (evidence) =>
                evidence.id,
            ),
        });

    return {
      ...structuralContext,

      knowledgeState:
        createKnowledgeStateReference(
          knowledgeContext,
        ),
    };
  }
}
