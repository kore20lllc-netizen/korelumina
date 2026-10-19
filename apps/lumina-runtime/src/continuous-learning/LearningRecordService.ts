import type { LearningWindowCommit } from "./ContinuousLearningLedger.js";
import type { LearningEvidenceCollector } from "./LearningEvidence.js";
import type { LearningRecordSynthesizer } from "./LearningRecordSynthesizer.js";
import type { LearningRecordWriter } from "./LearningRecordWriter.js";

/*
 * ADR-0042 (CL-1c): turn a captured window into a Learning Record.
 */

export type LearningOutcomeState =
  | "WRITTEN"
  | "HELD"
  | "SKIPPED"
  | "FAILED";

export interface LearningOutcome {
  state: LearningOutcomeState;
  reasons: readonly string[];
  recordId: string | null;
  repositoryPath: string | null;
  keptStatements: number | null;
  removedStatements: number | null;
  model: string | null;
  attemptedAt: number;
  attempts: number;
}

export interface LearningRequest {
  cycleId: string;
  fromCommit: string;
  commits: readonly LearningWindowCommit[];
  windowStart: number;
  windowEnd: number;
  attempts: number;
}

export interface Learner {
  learn(request: LearningRequest): Promise<LearningOutcome>;
}

export class LearningRecordService implements Learner {
  constructor(
    private readonly collector: Pick<LearningEvidenceCollector, "collect">,
    private readonly synthesizer: Pick<LearningRecordSynthesizer, "synthesize">,
    private readonly writer: Pick<LearningRecordWriter, "write">,
    private readonly now: () => number = Date.now,
  ) {}

  async learn(request: LearningRequest): Promise<LearningOutcome> {
    const base = {
      recordId: null,
      repositoryPath: null,
      keptStatements: null,
      removedStatements: null,
      model: null,
      attemptedAt: this.now(),
      attempts: request.attempts,
    };

    let evidence;
    try {
      evidence = this.collector.collect(request);
    } catch (error) {
      return { ...base, state: "FAILED", reasons: [`evidence_failed:${(error as Error).message}`] };
    }

    if (evidence.commits.length === 0) {
      return {
        ...base,
        state: "SKIPPED",
        reasons: ["only_learning_or_governance_bookkeeping_commits"],
      };
    }

    let check;
    try {
      check = await this.synthesizer.synthesize(evidence);
    } catch (error) {
      return { ...base, state: "FAILED", reasons: [`synthesis_failed:${(error as Error).message}`] };
    }

    const measured = {
      keptStatements: check.keptStatements,
      removedStatements: check.removedStatements,
      model: check.model,
    };

    if (!check.passed) {
      return { ...base, ...measured, state: "HELD", reasons: check.reasons };
    }

    try {
      const written = this.writer.write({
        record: check.record,
        evidence,
        cycleId: request.cycleId,
        model: check.model,
        writtenAt: this.now(),
      });
      return {
        ...base,
        ...measured,
        state: "WRITTEN",
        reasons: [],
        recordId: written.recordId,
        repositoryPath: written.repositoryPath,
      };
    } catch (error) {
      return { ...base, ...measured, state: "FAILED", reasons: [`write_failed:${(error as Error).message}`] };
    }
  }
}
