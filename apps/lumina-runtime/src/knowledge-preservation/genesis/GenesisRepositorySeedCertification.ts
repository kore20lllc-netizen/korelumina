import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationSourceBoundary,
} from "./GenesisConversationSourceBoundary.js";

import type {
  GenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

import type {
  GenesisHistoricalAdmissionGovernanceProjection,
  GenesisHistoricalAdmissionGovernanceRecord,
} from "./GenesisHistoricalAdmissionGovernanceProjection.js";


export type GenesisRepositorySeedCertificationId =
  `genesis-repository-seed-certification:${string}`;

export type GenesisRepositorySeedCertificationState =
  | "CERTIFIED"
  | "INCOMPLETE"
  | "BLOCKED";

export type GenesisExternalConversationCoverageState =
  | "COMPLETE"
  | "INCOMPLETE"
  | "NOT_ACQUIRED";

export interface GenesisRepositorySeedCertificationPartition {
  knowledgeSeedingEligible:
    readonly GenesisHistoricalAdmissionGovernanceRecord[];

  historicalCorrelationEligible:
    readonly GenesisHistoricalAdmissionGovernanceRecord[];

  historicalEvidenceOnly:
    readonly GenesisHistoricalAdmissionGovernanceRecord[];

  requiresGovernanceReview:
    readonly GenesisHistoricalAdmissionGovernanceRecord[];
}

export interface GenesisRepositorySeedCertification {
  certificationId:
    GenesisRepositorySeedCertificationId;

  repositorySeedCorpus:
    GenesisRepositorySeedCertificationState;

  replay: {
    exact:
      boolean;

    replayCount:
      number;

    totalSources:
      number | null;

    completedSources:
      number | null;

    admittedSources:
      number | null;

    skippedSources:
      number | null;

    blockedSources:
      number | null;
  };

  partition:
    GenesisRepositorySeedCertificationPartition;

  seedEvidenceIds:
    readonly string[];

  externalConversationCoverage:
    GenesisExternalConversationCoverageState;

  broaderEducationalCompleteness:
    "NOT_CERTIFIED";

  blockers:
    readonly string[];
}


function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          key => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}


function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


function sortedRecords(
  records:
    readonly GenesisHistoricalAdmissionGovernanceRecord[],
): readonly GenesisHistoricalAdmissionGovernanceRecord[] {
  return [
    ...records,
  ].sort(
    (
      left,
      right,
    ) =>
      left.historicalSourceId.localeCompare(
        right.historicalSourceId,
      ) ||
      left.evidenceId.localeCompare(
        right.evidenceId,
      ),
  );
}


function partitionFor(
  governance:
    GenesisHistoricalAdmissionGovernanceProjection,
): GenesisRepositorySeedCertificationPartition {
  return {
    knowledgeSeedingEligible:
      sortedRecords(
        governance.records.filter(
          record =>
            record.classification ===
            "knowledge-seeding-eligible",
        ),
      ),

    historicalCorrelationEligible:
      sortedRecords(
        governance.records.filter(
          record =>
            record.classification ===
            "historical-correlation-eligible",
        ),
      ),

    historicalEvidenceOnly:
      sortedRecords(
        governance.records.filter(
          record =>
            record.classification ===
            "historical-evidence-only",
        ),
      ),

    requiresGovernanceReview:
      sortedRecords(
        governance.records.filter(
          record =>
            record.classification ===
            "requires-governance-review",
        ),
      ),
  };
}


function conversationCoverage(
  corpus:
    GenesisCorpusReadModel,

  conversationSource:
    GenesisConversationSourceBoundary,
): GenesisExternalConversationCoverageState {
  /*
   * The certified conversation boundary uses "blocked" when no
   * governed historical acquisition mechanism currently exists.
   *
   * At the Repository Seed Corpus boundary that means conversation
   * evidence has not yet been acquired, not that repository-native
   * seeding is incomplete.
   */
  if (
    !conversationSource
      .acquisition
      .available
  ) {
    return "NOT_ACQUIRED";
  }

  if (
    conversationSource
      .acquisition
      .state !==
      "available" ||
    corpus
      .externalContext
      .notYetIngestedConversationSources >
      0 ||
    corpus
      .externalContext
      .pendingEpisodes >
      0
  ) {
    return "INCOMPLETE";
  }

  return "COMPLETE";
}


export function buildGenesisRepositorySeedCertification(
  input: {
    corpus:
      GenesisCorpusReadModel;

    historicalAdmissionGovernance:
      GenesisHistoricalAdmissionGovernanceProjection;

    conversationSource:
      GenesisConversationSourceBoundary;
  },
): GenesisRepositorySeedCertification {
  const {
    corpus,
    historicalAdmissionGovernance,
    conversationSource,
  } = input;

  const partition =
    partitionFor(
      historicalAdmissionGovernance,
    );

  const blockers:
    string[] =
      [];

  /*
   * Repository seed certification measures the governed
   * repository replay boundary only.
   *
   * Conversation remains first-class Genesis Evidence through
   * its external acquisition boundary. Missing conversation
   * acquisition is visible below but cannot falsely block this
   * repository-native certification.
   */
  if (
    corpus.replays.length ===
      0
  ) {
    blockers.push(
      "repository-replay-missing",
    );
  }

  const replayProgressAvailable =
    corpus.replays.length >
      0 &&
    corpus.replays.every(
      replay =>
        replay.progress !==
        null,
    );

  let totalSources:
    number | null =
      null;

  let completedSources:
    number | null =
      null;

  let admittedSources:
    number | null =
      null;

  let skippedSources:
    number | null =
      null;

  let blockedSources:
    number | null =
      null;

  if (
    replayProgressAvailable
  ) {
    totalSources =
      0;

    completedSources =
      0;

    admittedSources =
      0;

    skippedSources =
      0;

    blockedSources =
      0;

    for (
      const replay
      of corpus.replays
    ) {
      const progress =
        replay.progress!;

      if (
        progress.totalSources !==
          replay.totalManifestSources
      ) {
        throw new Error(
          "genesis_repository_seed_certification_replay_total_mismatch",
        );
      }

      if (
        progress.completedSources !==
          progress.admittedSources +
            progress.skippedSources +
            progress.blockedSources
      ) {
        throw new Error(
          "genesis_repository_seed_certification_replay_disposition_count_mismatch",
        );
      }

      totalSources +=
        progress.totalSources;

      completedSources +=
        progress.completedSources;

      admittedSources +=
        progress.admittedSources;

      skippedSources +=
        progress.skippedSources;

      blockedSources +=
        progress.blockedSources;

      if (
        replay.executionStatus !==
          "completed" ||
        replay.replayCorpusStatus !==
          "COMPLETE" ||
        progress.completedSources !==
          progress.totalSources ||
        progress.blockedSources !==
          0
      ) {
        blockers.push(
          `repository-replay-incomplete:${replay.replayId}`,
        );
      }
    }
  } else {
    blockers.push(
      "exact-replay-progress-unavailable",
    );
  }

  const admittedEvidenceIds =
    [
      ...new Set(
        corpus.replays.flatMap(
          replay =>
            replay.admittedEvidenceIds,
        ),
      ),
    ].sort();

  const governanceEvidenceIds =
    historicalAdmissionGovernance
      .records
      .map(
        record =>
          record.evidenceId,
      )
      .sort();

  if (
    new Set(
      governanceEvidenceIds,
    ).size !==
      governanceEvidenceIds.length
  ) {
    throw new Error(
      "genesis_repository_seed_certification_duplicate_governance_evidence",
    );
  }

  if (
    admittedEvidenceIds.length !==
      governanceEvidenceIds.length ||
    admittedEvidenceIds.some(
      (
        evidenceId,
        index,
      ) =>
        evidenceId !==
        governanceEvidenceIds[
          index
        ],
    )
  ) {
    blockers.push(
      "admitted-evidence-governance-partition-mismatch",
    );
  }

  if (
    admittedSources !==
      null &&
    admittedEvidenceIds.length !==
      admittedSources
  ) {
    blockers.push(
      "admitted-evidence-count-mismatch",
    );
  }

  if (
    partition
      .requiresGovernanceReview
      .length >
      0
  ) {
    blockers.push(
      "governance-review-required",
    );
  }

  if (
    partition
      .knowledgeSeedingEligible
      .some(
        record =>
          !record
            .knowledgeManufacturingAuthorized,
      )
  ) {
    throw new Error(
      "genesis_repository_seed_certification_seed_authorization_mismatch",
    );
  }

  if (
    historicalAdmissionGovernance
      .records
      .some(
        record =>
          record
            .knowledgeManufacturingAuthorized &&
          record.classification !==
            "knowledge-seeding-eligible",
      )
  ) {
    throw new Error(
      "genesis_repository_seed_certification_non_seed_authorization_detected",
    );
  }

  const seedEvidenceIds =
    partition
      .knowledgeSeedingEligible
      .map(
        record =>
          record.evidenceId,
      )
      .sort();

  const hardBlocked =
    (
      blockedSources ??
      0
    ) >
      0 ||
    corpus.replays.some(
      replay =>
        replay.executionStatus ===
          "blocked" ||
        replay.executionStatus ===
          "failed" ||
        replay.replayCorpusStatus ===
          "BLOCKED",
    ) ||
    partition
      .requiresGovernanceReview
      .length >
      0;

  const repositorySeedCorpus:
    GenesisRepositorySeedCertificationState =
      hardBlocked
        ? "BLOCKED"
        : blockers.length >
            0
          ? "INCOMPLETE"
          : "CERTIFIED";

  const externalConversationCoverage =
    conversationCoverage(
      corpus,
      conversationSource,
    );

  const certificationId =
    `genesis-repository-seed-certification:${hash({
      corpusProjectionId:
        corpus.projectionId,

      admissionGovernanceProjectionId:
        historicalAdmissionGovernance
          .projectionId,

      repositorySeedCorpus,

      replay: {
        exact:
          replayProgressAvailable,

        totalSources,

        completedSources,

        admittedSources,

        skippedSources,

        blockedSources,
      },

      partition,

      seedEvidenceIds,

      externalConversationCoverage,

      broaderEducationalCompleteness:
        "NOT_CERTIFIED",

      blockers:
        [...blockers].sort(),
    })}` as GenesisRepositorySeedCertificationId;

  return {
    certificationId,

    repositorySeedCorpus,

    replay: {
      exact:
        replayProgressAvailable,

      replayCount:
        corpus.replays.length,

      totalSources,

      completedSources,

      admittedSources,

      skippedSources,

      blockedSources,
    },

    partition,

    seedEvidenceIds,

    externalConversationCoverage,

    broaderEducationalCompleteness:
      "NOT_CERTIFIED",

    blockers:
      [...blockers].sort(),
  };
}
