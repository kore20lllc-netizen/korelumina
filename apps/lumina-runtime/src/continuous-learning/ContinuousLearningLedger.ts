import fs from "node:fs";
import path from "node:path";

import type {
  LearningOutcome,
} from "./LearningRecordService.js";
import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
  resolveRepositoryRoot,
} from "../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

/*
 * ADR-0042 (CL-1a): the continuous-learning checkpoint and the history of
 * every learning cycle. Tracked in git so it survives machine loss, like
 * the activation record (ADR-0041).
 */

export type LearningCycleTrigger = "automatic" | "manual";

export type LearningCycleOutcome =
  | "NO_NEW_WORK"
  | "HELD"
  | "CAPTURED"
  | "FAILED";

export interface LearningWindowCommit {
  sha: string;
  authorName: string;
  authorEmail: string;
  committedAt: number;
  subject: string;
}

export interface LearningCheckpoint {
  commit: string;
  committedAt: number;
  establishedAt: number;
  basis: string;
}

export interface LearningCycleRecord {
  cycleId: string;
  trigger: LearningCycleTrigger;
  startedAt: number;
  completedAt: number;
  fromCommit: string;
  toCommit: string | null;
  commits: readonly LearningWindowCommit[];
  outcome: LearningCycleOutcome;
  reasons: readonly string[];
  replayId: string | null;
  admittedSources: number | null;
  /* ADR-0042 (CL-1c): the Learning Record written from this window. */
  learning?: LearningOutcome;
}

export interface ContinuousLearningLedgerState {
  version: "continuous-learning-ledger:v1";
  checkpoint: LearningCheckpoint;
  cycles: LearningCycleRecord[];
}

export function resolveContinuousLearningRoot(): string {
  const configured =
    process.env.KORELUMINA_LEARNING_ROOT?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  /* F-25: a fresh temporary directory per test process. */
  if (isNodeTestProcess()) {
    return isolatedTestStorageRoot("continuous-learning");
  }
  return path.join(
    resolveRepositoryRoot(),
    "runtime",
    "governance",
    "continuous-learning",
  );
}

export class FileContinuousLearningLedger {
  constructor(
    private readonly root: () => string =
      resolveContinuousLearningRoot,
  ) {}

  private file(): string {
    return path.join(this.root(), "checkpoint.json");
  }

  read(): ContinuousLearningLedgerState | null {
    try {
      const parsed = JSON.parse(
        fs.readFileSync(this.file(), "utf8"),
      ) as ContinuousLearningLedgerState;
      if (
        parsed.version !== "continuous-learning-ledger:v1" ||
        !parsed.checkpoint?.commit
      ) {
        throw new Error("continuous_learning_ledger_invalid");
      }
      return parsed;
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return null;
      }
      throw error;
    }
  }

  write(state: ContinuousLearningLedgerState): void {
    fs.mkdirSync(this.root(), { recursive: true });
    const target = this.file();
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(
      temporary,
      `${JSON.stringify(state, null, 2)}\n`,
      "utf8",
    );
    fs.renameSync(temporary, target);
  }
}
