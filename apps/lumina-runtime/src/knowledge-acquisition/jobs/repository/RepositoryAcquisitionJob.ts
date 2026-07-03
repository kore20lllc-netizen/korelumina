import {
  KnowledgeAcquisitionOrchestrator,
} from "../../orchestration/index.js";

import {
  KnowledgeAcquisitionPipeline,
} from "../../KnowledgeAcquisitionPipeline.js";

import {
  KnowledgeAcquisitionRegistry,
} from "../../KnowledgeAcquisitionRegistry.js";

import {
  RepositoryAcquisitionProvider,
} from "../../providers/repository/index.js";

import type {
  KnowledgeAcquisitionJob,
  KnowledgeAcquisitionJobProgress,
  KnowledgeAcquisitionJobResult,
  KnowledgeAcquisitionJobStatus,
} from "../KnowledgeAcquisitionJob.js";

export class RepositoryAcquisitionJob
  implements KnowledgeAcquisitionJob
{
  readonly id: string;

  readonly providerName =
    "repository-acquisition-provider";

  status: KnowledgeAcquisitionJobStatus =
    "pending";

  progress: KnowledgeAcquisitionJobProgress =
    {
      processed: 0,
      total: 0,
      progress: 0,
    };

  constructor(
    private readonly repositoryRoot: string,
  ) {
    this.id =
      `repository:${repositoryRoot}`;
  }

  async run(): Promise<KnowledgeAcquisitionJobResult> {
    this.status =
      "running";

    const registry =
      new KnowledgeAcquisitionRegistry();

    registry.register(
      new RepositoryAcquisitionProvider(
        this.repositoryRoot,
      ),
    );

    const pipeline =
      new KnowledgeAcquisitionPipeline(
        registry,
      );

    const orchestrator =
      new KnowledgeAcquisitionOrchestrator(
        pipeline,
      );

    try {
      const result =
        await orchestrator.run();

      this.progress =
        {
          processed:
            result.preservedEvidence,

          total:
            result.acquiredEvidence,

          progress:
            result.acquiredEvidence === 0
              ? 100
              : 100,
        };

      this.status =
        "completed";

      return result;
    } catch (error) {
      this.status =
        "failed";

      throw error;
    }
  }
}
