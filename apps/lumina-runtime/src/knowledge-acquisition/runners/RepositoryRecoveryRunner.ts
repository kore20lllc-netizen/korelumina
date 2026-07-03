import {
  RepositoryAcquisitionJob,
} from "../jobs/index.js";

import {
  KnowledgeAcquisitionMetricsRegistry,
} from "../metrics/index.js";

export interface RepositoryRecoveryRunnerResult {
  jobId: string;
  status: string;
  acquiredEvidence: number;
  preservedEvidence: number;
  durationMs: number;
}

export class RepositoryRecoveryRunner {
  private readonly metricsRegistry =
    new KnowledgeAcquisitionMetricsRegistry();

  async run(
    repositoryRoot: string,
  ): Promise<RepositoryRecoveryRunnerResult> {
    const startedAt =
      Date.now();

    const job =
      new RepositoryAcquisitionJob(
        repositoryRoot,
      );

    const result =
      await job.run();

    const finishedAt =
      Date.now();

    const durationMs =
      finishedAt - startedAt;

    this.metricsRegistry.record({
      provider:
        job.providerName,

      startedAt,

      finishedAt,

      durationMs,

      acquiredEvidence:
        result.acquiredEvidence,

      preservedEvidence:
        result.preservedEvidence,

      compiledEvidence:
        result.preservedEvidence,

      normalizedEvidence:
        result.preservedEvidence,

      validatedEvidence:
        result.preservedEvidence,

      canonicalKnowledge:
        result.preservedEvidence,

      rejectedEvidence:
        0,

      failedEvidence:
        job.status === "failed"
          ? result.acquiredEvidence
          : 0,
    });

    return {
      jobId:
        job.id,

      status:
        job.status,

      acquiredEvidence:
        result.acquiredEvidence,

      preservedEvidence:
        result.preservedEvidence,

      durationMs,
    };
  }

  metrics() {
    return this.metricsRegistry.list();
  }
}
