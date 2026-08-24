import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationCorrelationCompletenessProjection,
} from "./GenesisConversationCorrelationCompleteness.js";

import type {
  GenesisConversationHistoryReconciliationProjection,
} from "./GenesisConversationHistoryReconciliationService.js";

import type {
  GenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

import type {
  GenesisRepositorySeedCertification,
} from "./GenesisRepositorySeedCertification.js";


export type GenesisDayZeroCertificationCandidateId =
  `genesis-day-zero-certification-candidate:${string}`;


export type GenesisDayZeroCertificationCandidateState =
  | "READY"
  | "INCOMPLETE"
  | "BLOCKED";


export interface GenesisDayZeroCertificationCandidate {
  candidateId:
    GenesisDayZeroCertificationCandidateId;

  state:
    GenesisDayZeroCertificationCandidateState;

  repositoryNative: {
    certificationId:
      GenesisRepositorySeedCertification[
        "certificationId"
      ];

    state:
      GenesisRepositorySeedCertification[
        "repositorySeedCorpus"
      ];

    replayExact:
      boolean;

    totalSources:
      number | null;

    completedSources:
      number | null;

    blockedSources:
      number | null;
  };

  conversationHistory: {
    expectedHistoryPresent:
      boolean;

    expectedInventoryId:
      string | null;

    acquisitionInventoryId:
      string;

    reconciliationState:
      "COMPLETE" |
      "INCOMPLETE" |
      "BLOCKED" |
      "NOT_ASSEMBLED";

    authorityId:
      string | null;

    authorityVersion:
      string | null;

    expectedRecoverableConversationIds:
      readonly string[];

    acquiredExpectedConversationIds:
      readonly string[];

    notYetAcquiredConversationIds:
      readonly string[];

    historicallyUnavailableConversationIds:
      readonly string[];

    unexpectedAcquiredConversationIds:
      readonly string[];
  };

  correlation: {
    projectionId:
      GenesisConversationCorrelationCompletenessProjection[
        "projectionId"
      ];

    state:
      GenesisConversationCorrelationCompletenessProjection[
        "state"
      ];

    conversationManifestSources:
      number;

    admittedConversationSources:
      number;

    correlatedConversationSources:
      number;

    correlatedConversationEvents:
      number;

    unresolvedExplicitLinks:
      number;

    episodeLineageGaps:
      number;
  };

  corpus: {
    projectionId:
      GenesisCorpusReadModel[
        "projectionId"
      ];

    sourceRevisions:
      number;

    historicalEvents:
      number;

    relationships:
      number;

    evolutionEpisodes:
      number;

    pendingExternalEpisodes:
      number;
  };

  provenance: {
    repositorySeedCertificationId:
      string;

    corpusProjectionId:
      string;

    conversationExpectedInventoryId:
      string | null;

    conversationAcquisitionInventoryId:
      string;

    conversationCorrelationProjectionId:
      string;
  };

  visibleHistoricalGaps: {
    historicallyUnavailableConversationIds:
      readonly string[];

    notYetAcquiredConversationIds:
      readonly string[];

    unexpectedAcquiredConversationIds:
      readonly string[];

    unresolvedExplicitHistoricalLinks:
      readonly {
        sourceHistoricalSourceId:
          string;

        targetHistoricalSourceId:
          string;

        relationship:
          "supersedes" |
          "conflicts-with";
      }[];

    episodeLineageGaps:
      readonly {
        episodeId:
          string;

        revisionId:
          string;

        reason:
          "cross-replay-revision-missing-previous-revision";
      }[];
  };

  blockers:
    readonly string[];

  /*
   * M51.3a assembles certification evidence only.
   * A READY candidate is not itself a certification.
   */
  dayZeroGenesisCertified:
    false;
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


export function buildGenesisDayZeroCertificationCandidate(
  input: {
    repositorySeedCertification:
      GenesisRepositorySeedCertification;

    corpus:
      GenesisCorpusReadModel;

    conversationHistory:
      GenesisConversationHistoryReconciliationProjection |
      null;

    conversationCorrelation:
      GenesisConversationCorrelationCompletenessProjection;
  },
): GenesisDayZeroCertificationCandidate {
  const {
    repositorySeedCertification,
    corpus,
    conversationHistory,
    conversationCorrelation,
  } = input;

  const expectedHistory =
    conversationHistory
      ?.expectedHistory ??
    null;

  const reconciliation =
    conversationHistory
      ?.reconciliation ??
    null;

  const acquisitionInventoryId =
    conversationHistory
      ?.acquisitionInventory
      .inventoryId ??
    "conversation-acquisition-inventory-not-assembled";

  const blockers:
    string[] =
      [];

  if (
    repositorySeedCertification
      .repositorySeedCorpus !==
    "CERTIFIED"
  ) {
    blockers.push(
      "repository-native-genesis-not-certified",
    );
  }

  if (
    !repositorySeedCertification
      .replay.exact
  ) {
    blockers.push(
      "repository-replay-integrity-not-exact",
    );
  }

  if (
    !conversationHistory
  ) {
    blockers.push(
      "conversation-history-reconciliation-not-assembled",
    );
  }

  if (
    !expectedHistory
  ) {
    blockers.push(
      "authoritative-conversation-history-inventory-missing",
    );
  }

  if (
    !reconciliation
  ) {
    blockers.push(
      "conversation-history-reconciliation-missing",
    );
  } else if (
    reconciliation.state !==
    "COMPLETE"
  ) {
    blockers.push(
      "conversation-history-coverage-incomplete",
    );
  }

  if (
    conversationCorrelation.state !==
    "COMPLETE"
  ) {
    blockers.push(
      "conversation-historical-correlation-incomplete",
    );
  }

  if (
    corpus.externalContext
      .pendingEpisodes >
    0
  ) {
    blockers.push(
      "genesis-external-context-pending",
    );
  }

  const hardBlocked =
    repositorySeedCertification
      .repositorySeedCorpus ===
      "BLOCKED" ||
    reconciliation?.state ===
      "BLOCKED";

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state:
    GenesisDayZeroCertificationCandidateState =
      hardBlocked
        ? "BLOCKED"
        : normalizedBlockers.length >
            0
          ? "INCOMPLETE"
          : "READY";

  const expectedRecoverableConversationIds =
    reconciliation
      ?.expectedRecoverableConversationIds ??
    [];

  const acquiredExpectedConversationIds =
    reconciliation
      ?.acquiredExpectedConversationIds ??
    [];

  const notYetAcquiredConversationIds =
    reconciliation
      ?.notYetAcquiredConversationIds ??
    [];

  const historicallyUnavailableConversationIds =
    reconciliation
      ?.historicallyUnavailableConversationIds ??
    [];

  const unexpectedAcquiredConversationIds =
    reconciliation
      ?.unexpectedAcquiredConversationIds ??
    [];

  const provenance = {
    repositorySeedCertificationId:
      repositorySeedCertification
        .certificationId,

    corpusProjectionId:
      corpus.projectionId,

    conversationExpectedInventoryId:
      expectedHistory
        ?.inventoryId ??
      null,

    conversationAcquisitionInventoryId:
      acquisitionInventoryId,

    conversationCorrelationProjectionId:
      conversationCorrelation
        .projectionId,
  };

  const candidateId =
    `genesis-day-zero-certification-candidate:${hash({
      state,

      provenance,

      repositoryNativeState:
        repositorySeedCertification
          .repositorySeedCorpus,

      repositoryReplay:
        repositorySeedCertification
          .replay,

      conversationReconciliationState:
        reconciliation?.state ??
        "NOT_ASSEMBLED",

      expectedRecoverableConversationIds,

      acquiredExpectedConversationIds,

      notYetAcquiredConversationIds,

      historicallyUnavailableConversationIds,

      unexpectedAcquiredConversationIds,

      correlationProjectionId:
        conversationCorrelation
          .projectionId,

      corpusProjectionId:
        corpus.projectionId,

      blockers:
        normalizedBlockers,
    })}` as GenesisDayZeroCertificationCandidateId;

  return {
    candidateId,

    state,

    repositoryNative: {
      certificationId:
        repositorySeedCertification
          .certificationId,

      state:
        repositorySeedCertification
          .repositorySeedCorpus,

      replayExact:
        repositorySeedCertification
          .replay.exact,

      totalSources:
        repositorySeedCertification
          .replay.totalSources,

      completedSources:
        repositorySeedCertification
          .replay.completedSources,

      blockedSources:
        repositorySeedCertification
          .replay.blockedSources,
    },

    conversationHistory: {
      expectedHistoryPresent:
        expectedHistory !==
        null,

      expectedInventoryId:
        expectedHistory
          ?.inventoryId ??
        null,

      acquisitionInventoryId,

      reconciliationState:
        reconciliation
          ?.state ??
        "NOT_ASSEMBLED",

      authorityId:
        expectedHistory
          ?.authority
          .authorityId ??
        null,

      authorityVersion:
        expectedHistory
          ?.authority
          .version ??
        null,

      expectedRecoverableConversationIds,

      acquiredExpectedConversationIds,

      notYetAcquiredConversationIds,

      historicallyUnavailableConversationIds,

      unexpectedAcquiredConversationIds,
    },

    correlation: {
      projectionId:
        conversationCorrelation
          .projectionId,

      state:
        conversationCorrelation
          .state,

      conversationManifestSources:
        conversationCorrelation
          .conversationManifestSources,

      admittedConversationSources:
        conversationCorrelation
          .admittedConversationSources,

      correlatedConversationSources:
        conversationCorrelation
          .correlatedConversationSources,

      correlatedConversationEvents:
        conversationCorrelation
          .correlatedConversationEvents,

      unresolvedExplicitLinks:
        conversationCorrelation
          .unresolvedExplicitLinks
          .length,

      episodeLineageGaps:
        conversationCorrelation
          .episodeLineageGaps
          .length,
    },

    corpus: {
      projectionId:
        corpus.projectionId,

      sourceRevisions:
        corpus.sourceSummary
          .sourceRevisions,

      historicalEvents:
        corpus.evolutionSummary
          .historicalEvents,

      relationships:
        corpus.evolutionSummary
          .relationships,

      evolutionEpisodes:
        corpus.evolutionSummary
          .evolutionEpisodes,

      pendingExternalEpisodes:
        corpus.externalContext
          .pendingEpisodes,
    },

    provenance,

    visibleHistoricalGaps: {
      historicallyUnavailableConversationIds,

      notYetAcquiredConversationIds,

      unexpectedAcquiredConversationIds,

      unresolvedExplicitHistoricalLinks:
        conversationCorrelation
          .unresolvedExplicitLinks,

      episodeLineageGaps:
        conversationCorrelation
          .episodeLineageGaps,
    },

    blockers:
      normalizedBlockers,

    dayZeroGenesisCertified:
      false,
  };
}
