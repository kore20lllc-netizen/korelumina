import {
  repositoryAcquisitionService,
} from "../knowledge-acquisition/index.js";

import type {
  KnowledgeAcquisitionMetrics,
} from "../knowledge-acquisition/index.js";

import type {
  KnowledgeOperationsSnapshot,
  KnowledgeOperationsStatus,
} from "@korelumina/platform-sdk";

export interface KnowledgeProviderSummary {
  id: string;
  name: string;
  sourceType: string;
  status: "available" | "planned";
}

function normalizeStatus(
  status: string | undefined,
): KnowledgeOperationsStatus {
  if (
    status === "running" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }

  return "idle";
}

function healthScore(input: {
  evidenceTotal: number;
  canonicalItems: number;
  promotionRate: number;
}) {
  if (input.evidenceTotal === 0) {
    return 0;
  }

  const preservation =
    input.canonicalItems / input.evidenceTotal;

  return Math.round(
    Math.min(
      100,
      Math.max(
        0,
        ((preservation + input.promotionRate) / 2) *
          100,
      ),
    ),
  );
}

export class KnowledgeOperationsService {
  async acquireRepository(
    repositoryId: string,
    repositoryRoot: string,
  ) {
    return repositoryAcquisitionService.acquire(
      repositoryId,
      repositoryRoot,
    );
  }

  getRepositoryStatus(
    repositoryId: string,
  ) {
    return repositoryAcquisitionService.getStatus(
      repositoryId,
    );
  }

  getRepositoryMetrics(
    repositoryId: string,
  ): readonly KnowledgeAcquisitionMetrics[] {
    return repositoryAcquisitionService.getMetrics(
      repositoryId,
    );
  }

  getSnapshot(): KnowledgeOperationsSnapshot {
    const statuses =
      repositoryAcquisitionService.listStatuses();

    const latest =
      statuses.at(-1);

    const status =
      normalizeStatus(latest?.status);

    const totalEvidence =
      latest?.acquiredEvidence ?? 0;

    const processedEvidence =
      latest?.preservedEvidence ?? 0;

    const promotionRate =
      totalEvidence > 0
        ? processedEvidence / totalEvidence
        : 0;

    const progress =
      totalEvidence > 0
        ? (processedEvidence / totalEvidence) * 100
        : 0;

    const canonicalItems =
      processedEvidence;

    const score =
      healthScore({
        evidenceTotal: totalEvidence,
        canonicalItems,
        promotionRate,
      });

    return {
      generatedAt: Date.now(),

      summary: {
        totalKnowledgeItems:
          canonicalItems,
        totalEvidence,
        healthScore:
          score,
        promotionRate,
      },

      acquisition: {
        status,
        repository:
          latest?.repositoryRoot,
        stage:
          status,
        filesScanned:
          totalEvidence,
        evidenceExtracted:
          totalEvidence,
        progress,
      },

      recovery: {
        status,
        repositoryRoot:
          latest?.repositoryRoot,
        processedEvidence,
        totalEvidence,
        progress,
      },

      evidence: {
        total:
          totalEvidence,
        byType: {},
      },

      knowledge: {
        candidateItems:
          processedEvidence,
        canonicalItems,
        promotionRate,
      },

      coverage: {
        documentation:
          latest ? 1 : 0,
        git: 0,
        conversations: 0,
        runtime: 0,
        issues: 0,
        pullRequests: 0,
      },
    };
  }

  listProviders(): KnowledgeProviderSummary[] {
    return [
      {
        id: "repository",
        name: "Repository",
        sourceType: "repository",
        status: "available",
      },
      {
        id: "conversation",
        name: "Conversation",
        sourceType: "conversation",
        status: "planned",
      },
      {
        id: "git",
        name: "Git",
        sourceType: "git",
        status: "planned",
      },
      {
        id: "runtime",
        name: "Runtime",
        sourceType: "runtime",
        status: "planned",
      },
    ];
  }
}

export const knowledgeOperationsService =
  new KnowledgeOperationsService();
