import {
  repositoryAcquisitionService,
} from "../knowledge-acquisition/index.js";

import type {
  KnowledgeOperationsSnapshot,
} from "./KnowledgeOperationsSnapshot.js";

export interface KnowledgeProviderSummary {
  id: string;
  name: string;
  sourceType: string;
  status: "available" | "planned";
}

export class KnowledgeOperationsService {
  getSnapshot(): KnowledgeOperationsSnapshot {
    const statuses =
      repositoryAcquisitionService.listStatuses();

    const latest =
      statuses.at(-1);

    return {
      generatedAt:
        Date.now(),

      recovery: {
        status:
          latest?.status ?? "idle",

        repositoryRoot:
          latest?.repositoryRoot,

        processedEvidence:
          latest?.preservedEvidence ?? 0,

        totalEvidence:
          latest?.acquiredEvidence ?? 0,

        progress:
          latest?.acquiredEvidence
            ? (latest.preservedEvidence /
                latest.acquiredEvidence) *
              100
            : 0,
      },

      evidence: {
        total:
          latest?.acquiredEvidence ?? 0,

        byType:
          {},
      },

      knowledge: {
        candidateItems:
          latest?.preservedEvidence ?? 0,

        canonicalItems:
          latest?.preservedEvidence ?? 0,

        promotionRate:
          latest?.acquiredEvidence
            ? latest.preservedEvidence /
              latest.acquiredEvidence
            : 0,
      },

      coverage: {
        documentation:
          latest?.preservedEvidence ? 1 : 0,

        git:
          0,

        conversations:
          0,

        runtime:
          0,

        issues:
          0,

        pullRequests:
          0,
      },
    };
  }

  listProviders(): KnowledgeProviderSummary[] {
    return [
      {
        id:
          "repository",

        name:
          "Repository",

        sourceType:
          "repository",

        status:
          "available",
      },
      {
        id:
          "conversation",

        name:
          "Conversation",

        sourceType:
          "conversation",

        status:
          "planned",
      },
      {
        id:
          "git",

        name:
          "Git",

        sourceType:
          "git",

        status:
          "planned",
      },
      {
        id:
          "runtime",

        name:
          "Runtime",

        sourceType:
          "runtime",

        status:
          "planned",
      },
    ];
  }
}

export const knowledgeOperationsService =
  new KnowledgeOperationsService();
