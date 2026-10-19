import crypto from "node:crypto";

import type {
  ContinuousLearningLedgerState,
  FileContinuousLearningLedger,
  LearningCheckpoint,
  LearningCycleRecord,
  LearningCycleTrigger,
  LearningWindowCommit,
} from "./ContinuousLearningLedger.js";
import type {
  LearningWindowSource,
} from "./GitLearningWindow.js";

/*
 * ADR-0042 (CL-1a): one learning cycle captures all owner-approved work
 * since the checkpoint. The owner's commit is the approval (Decision 1).
 *
 * This ticket implements capture. Synthesis of a Learning Record (CL-1c)
 * and automatic admission (CL-1d) build on the CAPTURED cycle.
 */

export interface LearningCaptureRequest {
  repository: string;
  ref: string;
  historicalStart: number;
  explicitlyExcludedSourceIds: string[];
}

export interface LearningCaptureResult {
  replayId: string | null;
  admittedSources: number;
}

export interface ContinuousLearningCycleServiceDependencies {
  ledger: Pick<FileContinuousLearningLedger, "read" | "write">;
  window: LearningWindowSource;
  capture(request: LearningCaptureRequest): Promise<LearningCaptureResult>;
  /** Day-0 certification time: the first checkpoint (ADR-0042 Decision 2). */
  initialCheckpointTime(): number | null;
  ownerEmails: readonly string[];
  now?: () => number;
}

export interface ContinuousLearningStatus {
  checkpoint: LearningCheckpoint | null;
  pendingCommits: readonly LearningWindowCommit[];
  nonOwnerPendingCommits: readonly LearningWindowCommit[];
  running: boolean;
  cycles: readonly LearningCycleRecord[];
}

const HISTORY_LIMIT = 500;

export class ContinuousLearningCycleService {
  private running: Promise<LearningCycleRecord> | null = null;
  private readonly now: () => number;
  private readonly owners: Set<string>;

  constructor(
    private readonly dependencies: ContinuousLearningCycleServiceDependencies,
  ) {
    this.now = dependencies.now ?? Date.now;
    this.owners = new Set(
      dependencies.ownerEmails.map((email) => email.trim().toLowerCase()),
    );
  }

  private isOwner(commit: LearningWindowCommit): boolean {
    return this.owners.has(commit.authorEmail.trim().toLowerCase());
  }

  /*
   * Read the ledger, creating the first checkpoint from the Day-0
   * certification when no ledger exists yet.
   */
  private ensureLedger(): ContinuousLearningLedgerState {
    const existing = this.dependencies.ledger.read();
    if (existing) return existing;

    const day0 = this.dependencies.initialCheckpointTime();
    if (day0 === null) {
      throw new Error("continuous_learning_initial_checkpoint_unavailable");
    }
    const commit = this.dependencies.window.lastCommitAtOrBefore(day0);
    if (!commit) {
      throw new Error("continuous_learning_initial_checkpoint_commit_not_found");
    }
    const state: ContinuousLearningLedgerState = {
      version: "continuous-learning-ledger:v1",
      checkpoint: {
        commit: commit.sha,
        committedAt: commit.committedAt,
        establishedAt: this.now(),
        basis: "Day-0 Genesis certification (ADR-0042 Decision 2)",
      },
      cycles: [],
    };
    this.dependencies.ledger.write(state);
    return state;
  }

  status(): ContinuousLearningStatus {
    const ledger = this.ensureLedger();
    const pending = this.dependencies.window.commitsAfter(
      ledger.checkpoint.commit,
    );
    return {
      checkpoint: ledger.checkpoint,
      pendingCommits: pending,
      nonOwnerPendingCommits: pending.filter((commit) => !this.isOwner(commit)),
      running: this.running !== null,
      cycles: [...ledger.cycles].reverse().slice(0, 50),
    };
  }

  isRunning(): boolean {
    return this.running !== null;
  }

  /** Start a cycle, or join the one already running. */
  run(trigger: LearningCycleTrigger): Promise<LearningCycleRecord> {
    if (!this.running) {
      this.running = this.execute(trigger).finally(() => {
        this.running = null;
      });
    }
    return this.running;
  }

  private record(
    ledger: ContinuousLearningLedgerState,
    cycle: LearningCycleRecord,
    advanceTo: LearningCheckpoint | null,
  ): LearningCycleRecord {
    const next: ContinuousLearningLedgerState = {
      ...ledger,
      checkpoint: advanceTo ?? ledger.checkpoint,
      cycles: [...ledger.cycles, cycle].slice(-HISTORY_LIMIT),
    };
    this.dependencies.ledger.write(next);
    return cycle;
  }

  private async execute(
    trigger: LearningCycleTrigger,
  ): Promise<LearningCycleRecord> {
    const startedAt = this.now();
    const ledger = this.ensureLedger();
    const fromCommit = ledger.checkpoint.commit;
    const cycleId = `learning-cycle:${crypto
      .createHash("sha256")
      .update(`${fromCommit}:${startedAt}`)
      .digest("hex")
      .slice(0, 16)}`;

    const base = {
      cycleId,
      trigger,
      startedAt,
      fromCommit,
      replayId: null,
      admittedSources: null,
    };

    let commits: LearningWindowCommit[];
    try {
      commits = this.dependencies.window.commitsAfter(fromCommit);
    } catch (error) {
      return this.record(
        ledger,
        {
          ...base,
          completedAt: this.now(),
          toCommit: null,
          commits: [],
          outcome: "FAILED",
          reasons: [`git_read_failed:${(error as Error).message}`],
        },
        null,
      );
    }

    if (commits.length === 0) {
      // Not recorded: an empty check is not a learning event.
      return {
        ...base,
        completedAt: this.now(),
        toCommit: fromCommit,
        commits: [],
        outcome: "NO_NEW_WORK",
        reasons: [],
      };
    }

    const toCommit = commits[commits.length - 1];
    const nonOwner = commits.filter((commit) => !this.isOwner(commit));
    if (nonOwner.length > 0) {
      return this.record(
        ledger,
        {
          ...base,
          completedAt: this.now(),
          toCommit: toCommit.sha,
          commits,
          outcome: "HELD",
          reasons: nonOwner.map(
            (commit) => `non_owner_commit:${commit.sha}:${commit.authorEmail}`,
          ),
        },
        null,
      );
    }

    /*
     * The replay window starts at the earliest window commit. Older
     * commits sharing that second are excluded explicitly so nothing
     * already learned is captured twice.
     */
    const historicalStart = Math.min(
      ...commits.map((commit) => commit.committedAt),
    );
    const inWindow = new Set(commits.map((commit) => commit.sha));
    const explicitlyExcludedSourceIds = this.dependencies.window
      .commitsSince(historicalStart)
      .filter((sha) => !inWindow.has(sha))
      .map((sha) => `genesis-source:commit:${sha}`);

    try {
      const head = this.dependencies.window.head();
      const result = await this.dependencies.capture({
        repository: this.dependencies.window.repositoryName(),
        ref: head.branch,
        historicalStart,
        explicitlyExcludedSourceIds,
      });

      return this.record(
        ledger,
        {
          ...base,
          completedAt: this.now(),
          toCommit: toCommit.sha,
          commits,
          outcome: "CAPTURED",
          reasons: [],
          replayId: result.replayId,
          admittedSources: result.admittedSources,
        },
        {
          commit: toCommit.sha,
          committedAt: toCommit.committedAt,
          establishedAt: this.now(),
          basis: `Learning cycle ${cycleId}`,
        },
      );
    } catch (error) {
      return this.record(
        ledger,
        {
          ...base,
          completedAt: this.now(),
          toCommit: toCommit.sha,
          commits,
          outcome: "FAILED",
          reasons: [`capture_failed:${(error as Error).message}`],
        },
        null,
      );
    }
  }
}
