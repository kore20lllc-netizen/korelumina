import path from "node:path";

import {
  RepositoryCorpusIngestion,
} from "./RepositoryCorpusIngestion.js";

export interface RepositoryRecoveryExecutionResult {
  repositoryRoot: string;
  repositoryEvidence: number;
  documentationEvidence: number;
  processedEvidence: number;
}

export class RepositoryRecoveryExecution {
  private readonly ingestion =
    new RepositoryCorpusIngestion();

  async execute(
    repositoryRoot: string,
  ): Promise<
    RepositoryRecoveryExecutionResult
  > {
    const absoluteRoot =
      path.resolve(
        repositoryRoot,
      );

    const report =
      await this.ingestion.ingest(
        absoluteRoot,
      );

    return {
      repositoryRoot:
        absoluteRoot,

      repositoryEvidence:
        report.repositoryEvidence,

      documentationEvidence:
        report.documentationEvidence,

      processedEvidence:
        report.processedEvidence,
    };
  }
}
