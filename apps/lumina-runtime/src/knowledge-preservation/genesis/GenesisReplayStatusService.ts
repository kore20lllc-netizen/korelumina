import type {
  KnowledgeManufacturingRun,
} from "../manufacturing/index.js";

import type {
  GenesisReplayCheckpoint,
} from "./GenesisReplayCheckpoint.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisReplayPersistenceStore,
} from "./GenesisReplayPersistence.js";

import type {
  GenesisReplayExecutionStatus,
  GenesisCorpusCompletionStatus,
  GenesisReplayProgress,
} from "./GenesisReplayState.js";

import type {
  GenesisReplayRunnerFailure,
  GenesisReplayRunnerOutcome,
} from "./GenesisReplayRunner.js";

import type {
  GenesisSourceManifestBuildReadiness,
} from "./GenesisSourceManifestBuilder.js";

export type GenesisReplayPersistenceReader =
  Pick<
    GenesisReplayPersistenceStore,
    | "loadManifestBuild"
    | "loadExecution"
    | "loadRunnerResult"
  >;

export interface GenesisKnowledgeManufacturingRunReader {
  list():
    KnowledgeManufacturingRun[];
}

export type GenesisReplayRecoveryEligibilityReason =
  | "ELIGIBLE"
  | "REPLAY_NOT_FOUND"
  | "EXECUTION_NOT_FOUND"
  | "ALREADY_COMPLETED"
  | "EXECUTION_NOT_RUNNING"
  | "CURRENT_POSITION_MISSING";

export interface GenesisReplayRecoveryEligibility {
  eligible:
    boolean;

  reason:
    GenesisReplayRecoveryEligibilityReason;
}

export interface GenesisReplayAdmissionLink {
  evidenceId:
    string;

  manufacturingRunId:
    string | null;

  linked:
    boolean;

  ambiguous:
    boolean;

  matchingManufacturingRunIds:
    readonly string[];

  status:
    KnowledgeManufacturingRun["status"] |
    null;

  currentStage:
    KnowledgeManufacturingRun["currentStage"] |
    null;

  packageId:
    string | null;

  canonicalKnowledgeIds:
    readonly string[];
}

export interface GenesisReplayStatusSnapshot {
  replayId:
    GenesisReplayId;

  found:
    boolean;

  manifestPresent:
    boolean;

  executionPresent:
    boolean;

  manifestId:
    string | null;

  manifestReadiness:
    GenesisSourceManifestBuildReadiness |
    null;

  manifestErrors:
    number;

  totalManifestSources:
    number;

  executionStatus:
    GenesisReplayExecutionStatus |
    null;

  corpusStatus:
    GenesisCorpusCompletionStatus |
    null;

  currentManifestIndex:
    number | null;

  currentHistoricalSourceId:
    string | null;

  lastCompletedManifestIndex:
    number | null;

  progress:
    GenesisReplayProgress |
    null;

  checkpoint:
    GenesisReplayCheckpoint |
    null;

  runnerOutcome:
    GenesisReplayRunnerOutcome |
    null;

  runnerFailure:
    GenesisReplayRunnerFailure |
    null;

  recovery:
    GenesisReplayRecoveryEligibility;

  admittedEvidenceIds:
    readonly string[];

  admissionLinks:
    readonly GenesisReplayAdmissionLink[];

  allAdmittedEvidenceLinked:
    boolean;
}

export interface InspectGenesisReplayStatusInput {
  replayId:
    GenesisReplayId;

  persistence:
    GenesisReplayPersistenceReader;

  manufacturingRuns?:
    GenesisKnowledgeManufacturingRunReader;
}

function recoveryEligibility(
  input: {
    found:
      boolean;

    executionPresent:
      boolean;

    executionStatus:
      GenesisReplayExecutionStatus |
      null;

    currentManifestIndex:
      number | null;
  },
): GenesisReplayRecoveryEligibility {
  if (
    !input.found
  ) {
    return {
      eligible:
        false,

      reason:
        "REPLAY_NOT_FOUND",
    };
  }

  if (
    !input.executionPresent
  ) {
    return {
      eligible:
        false,

      reason:
        "EXECUTION_NOT_FOUND",
    };
  }

  if (
    input.executionStatus ===
      "completed"
  ) {
    return {
      eligible:
        false,

      reason:
        "ALREADY_COMPLETED",
    };
  }

  if (
    input.executionStatus !==
      "running"
  ) {
    return {
      eligible:
        false,

      reason:
        "EXECUTION_NOT_RUNNING",
    };
  }

  if (
    input.currentManifestIndex ===
      null
  ) {
    return {
      eligible:
        false,

      reason:
        "CURRENT_POSITION_MISSING",
    };
  }

  return {
    eligible:
      true,

    reason:
      "ELIGIBLE",
  };
}

function admissionLinks(
  evidenceIds:
    readonly string[],

  reader:
    GenesisKnowledgeManufacturingRunReader |
    undefined,
): readonly GenesisReplayAdmissionLink[] {
  if (
    evidenceIds.length ===
      0
  ) {
    return [];
  }

  const runs =
    reader?.list() ??
    [];

  const runsByEvidenceId =
    new Map<
      string,
      KnowledgeManufacturingRun[]
    >();

  for (
    const run
    of runs
  ) {
    const matches =
      runsByEvidenceId.get(
        run.evidenceId,
      ) ??
      [];

    matches.push(
      run,
    );

    runsByEvidenceId.set(
      run.evidenceId,
      matches,
    );
  }

  return evidenceIds.map(
    (
      evidenceId,
    ) => {
      const matches =
        runsByEvidenceId.get(
          evidenceId,
        ) ??
        [];

      const ambiguous =
        matches.length >
        1;

      const run =
        matches.length ===
        1
          ? matches[0]
          : undefined;

      return {
        evidenceId,

        manufacturingRunId:
          run?.id ??
          null,

        linked:
          matches.length >
          0,

        ambiguous,

        matchingManufacturingRunIds:
          matches
            .map(
              (
                item,
              ) =>
                item.id,
            )
            .sort(),

        status:
          run?.status ??
          null,

        currentStage:
          run?.currentStage ??
          null,

        packageId:
          run?.packageId ??
          null,

        canonicalKnowledgeIds:
          run
            ? [
                ...run
                  .canonicalKnowledgeIds,
              ]
            : [],
      };
    },
  );
}

export function inspectGenesisReplayStatus(
  input:
    InspectGenesisReplayStatusInput,
): GenesisReplayStatusSnapshot {
  /*
   * Persistence load methods are existing integrity gates.
   *
   * A corrupt or identity-invalid artifact must fail closed
   * here exactly as it does for recovery. Inspection does not
   * suppress or reinterpret those failures.
   */
  const manifestBuild =
    input.persistence
      .loadManifestBuild(
        input.replayId,
      );

  const execution =
    input.persistence
      .loadExecution(
        input.replayId,
      );

  const runnerResult =
    input.persistence
      .loadRunnerResult(
        input.replayId,
      );

  const found =
    Boolean(
      manifestBuild ||
      execution ||
      runnerResult,
    );

  const admittedEvidenceIds =
    execution?.checkpoint
      ?.admittedEvidenceIds ??
    [];

  const links =
    admissionLinks(
      admittedEvidenceIds,
      input.manufacturingRuns,
    );

  const executionStatus =
    execution?.state.status ??
    null;

  const currentManifestIndex =
    execution?.state
      .currentManifestIndex ??
    null;

  return {
    replayId:
      input.replayId,

    found,

    manifestPresent:
      Boolean(
        manifestBuild,
      ),

    executionPresent:
      Boolean(
        execution,
      ),

    manifestId:
      manifestBuild
        ?.manifest.manifestId ??
      execution
        ?.manifest.manifestId ??
      null,

    manifestReadiness:
      manifestBuild
        ?.readiness ??
      null,

    manifestErrors:
      manifestBuild
        ?.errors.length ??
      0,

    totalManifestSources:
      manifestBuild
        ?.manifest.entries.length ??
      execution
        ?.manifest.entries.length ??
      0,

    executionStatus,

    corpusStatus:
      execution
        ?.state.corpusStatus ??
      null,

    currentManifestIndex,

    currentHistoricalSourceId:
      execution
        ?.state
        .currentHistoricalSourceId ??
      null,

    lastCompletedManifestIndex:
      execution
        ?.state
        .lastCompletedManifestIndex ??
      null,

    progress:
      execution
        ?.state.progress ??
      null,

    checkpoint:
      execution
        ?.checkpoint ??
      null,

    runnerOutcome:
      runnerResult
        ?.outcome ??
      null,

    runnerFailure:
      runnerResult
        ?.failure ??
      null,

    recovery:
      recoveryEligibility({
        found,

        executionPresent:
          Boolean(
            execution,
          ),

        executionStatus,

        currentManifestIndex,
      }),

    admittedEvidenceIds: [
      ...admittedEvidenceIds,
    ],

    admissionLinks:
      links,

    allAdmittedEvidenceLinked:
      links.every(
        (
          link,
        ) =>
          link.linked &&
          !link.ambiguous,
      ),
  };
}
