import {
  RepositoryRecoveryRunner,
} from "../runners/index.js";

import type {
  KnowledgeAcquisitionMetrics,
} from "../metrics/index.js";

export type RepositoryAcquisitionStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface RepositoryAcquisitionState {
  repositoryId: string;
  repositoryRoot: string;
  status: RepositoryAcquisitionStatus;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  acquiredEvidence: number;
  preservedEvidence: number;
  error?: string;
}

export class RepositoryAcquisitionService {
  private readonly states =
    new Map<
      string,
      RepositoryAcquisitionState
    >();

  private readonly metrics =
    new Map<
      string,
      readonly KnowledgeAcquisitionMetrics[]
    >();

  async acquire(
    repositoryId: string,
    repositoryRoot: string,
  ): Promise<RepositoryAcquisitionState> {
    const startedAt =
      Date.now();

    this.states.set(
      repositoryId,
      {
        repositoryId,
        repositoryRoot,
        status: "running",
        startedAt,
        acquiredEvidence: 0,
        preservedEvidence: 0,
      },
    );

    const runner =
      new RepositoryRecoveryRunner();

    try {
      const result =
        await runner.run(
          repositoryRoot,
        );

      const finishedAt =
        Date.now();

      const state: RepositoryAcquisitionState =
        {
          repositoryId,
          repositoryRoot,
          status: "completed",
          startedAt,
          finishedAt,
          durationMs:
            finishedAt - startedAt,
          acquiredEvidence:
            result.acquiredEvidence,
          preservedEvidence:
            result.preservedEvidence,
        };

      this.states.set(
        repositoryId,
        state,
      );

      this.metrics.set(
        repositoryId,
        runner.metrics(),
      );

      return state;
    } catch (error) {
      const finishedAt =
        Date.now();

      const state: RepositoryAcquisitionState =
        {
          repositoryId,
          repositoryRoot,
          status: "failed",
          startedAt,
          finishedAt,
          durationMs:
            finishedAt - startedAt,
          acquiredEvidence: 0,
          preservedEvidence: 0,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        };

      this.states.set(
        repositoryId,
        state,
      );

      return state;
    }
  }

  getStatus(
    repositoryId: string,
  ): RepositoryAcquisitionState | undefined {
    return this.states.get(
      repositoryId,
    );
  }

  listStatuses(): RepositoryAcquisitionState[] {
    return [
      ...this.states.values(),
    ];
  }

  getMetrics(
    repositoryId: string,
  ): readonly KnowledgeAcquisitionMetrics[] {
    return (
      this.metrics.get(
        repositoryId,
      ) ?? []
    );
  }
}

export const repositoryAcquisitionService =
  new RepositoryAcquisitionService();
