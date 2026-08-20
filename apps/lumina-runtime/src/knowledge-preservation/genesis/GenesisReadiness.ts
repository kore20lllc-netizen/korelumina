import {
  createHash,
} from "node:crypto";

import type {
  HistoricalSourceClass,
} from "./HistoricalSource.js";

import type {
  GenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

import type {
  GenesisDocumentationGovernanceProjection,
} from "./GenesisDocumentationGovernance.js";

import type {
  GenesisKnowledgeLifecycleProjection,
} from "./GenesisKnowledgeLifecycleCorrelation.js";

import type {
  GenesisTemporalChronology,
} from "./GenesisTemporalChronology.js";

export type GenesisReadinessProjectionId =
  `genesis-readiness:${string}`;

export type GenesisReadinessDimensionState =
  | "complete"
  | "partial"
  | "blocked"
  | "unavailable"
  | "not-evaluated";

export type GenesisOverallReadiness =
  | "incomplete"
  | "blocked"
  | "ready";

export interface GenesisReadinessPolicy {
  policyId:
    string;

  requiredSourceClasses:
    readonly HistoricalSourceClass[];
}

export interface GenesisSourceCoverageReadiness {
  state:
    GenesisReadinessDimensionState;

  discoveredSourceRevisions:
    number;

  requiredSourceClasses:
    readonly HistoricalSourceClass[];

  presentRequiredSourceClasses:
    readonly HistoricalSourceClass[];

  missingRequiredSourceClasses:
    readonly HistoricalSourceClass[];

  externalSourceReferences:
    number;

  pendingExternalContextEpisodes:
    number;

  notYetIngestedConversationSources:
    number;
}

export interface GenesisReplayCoverageReadiness {
  state:
    GenesisReadinessDimensionState;

  replayCount:
    number;

  completedReplays:
    number;

  blockedReplays:
    number;

  failedReplays:
    number;

  runningReplays:
    number;

  pendingReplays:
    number;

  manifestSources:
    number;

  sourcesReplayed:
    number | null;

  sourcesReplayedMeasurement:
    "unavailable";
}

export interface GenesisKnowledgeReadiness {
  state:
    GenesisReadinessDimensionState;

  evidenceAdmitted:
    number;

  manufacturingCorrelated:
    number;

  manufacturingAmbiguous:
    number;

  manufacturingUncorrelated:
    number;

  knowledgeIRReached:
    number;

  validated:
    number;

  packaged:
    number;

  awaitingCanonicalReview:
    number;

  canonical:
    number;

  memoryCorrelatedCanonicalItems:
    number;

  memoryAdaptationValidated:
    number;

  failed:
    number;

  blocked:
    number;

  educationalEligibilityEvaluated:
    number;
}

export interface GenesisChronologyReadiness {
  state:
    GenesisReadinessDimensionState;

  historicalEvents:
    number;

  earliestOccurredAt:
    number | null;

  latestOccurredAt:
    number | null;

  sourceRevisionsWithoutHistoricalEvents:
    number;

  externalContextPendingEpisodes:
    number;

  conflictedEpisodes:
    number;

  unresolvedRelationships:
    number;
}

export interface GenesisAuthorityReadiness {
  state:
    GenesisReadinessDimensionState;

  documents:
    number;

  governing:
    number;

  unresolved:
    number;

  missingScope:
    number;

  missingEffectivePeriod:
    number;
}

export interface GenesisEducationalReadiness {
  state:
    "not-evaluated";

  eligibleRecords:
    null;

  reason:
    "CA-005 educational eligibility not yet evaluated";
}

export type GenesisReadinessBlockerCode =
  | "required-source-class-missing"
  | "external-conversation-not-ingested"
  | "external-context-pending"
  | "replay-blocked"
  | "replay-failed"
  | "replay-incomplete"
  | "replayed-source-count-unavailable"
  | "chronology-gap"
  | "chronology-conflict"
  | "correlation-unresolved"
  | "documentation-authority-unresolved"
  | "documentation-scope-missing"
  | "documentation-effective-period-missing"
  | "manufacturing-correlation-ambiguous"
  | "manufacturing-correlation-missing"
  | "knowledge-manufacturing-failed"
  | "knowledge-manufacturing-blocked"
  | "canonical-review-pending"
  | "educational-eligibility-not-evaluated";

export interface GenesisReadinessBlocker {
  code:
    GenesisReadinessBlockerCode;

  count:
    number;

  detail:
    string;
}

export interface GenesisReadinessProjection {
  projectionId:
    GenesisReadinessProjectionId;

  policyId:
    string;

  overall:
    GenesisOverallReadiness;

  sources:
    GenesisSourceCoverageReadiness;

  replay:
    GenesisReplayCoverageReadiness;

  knowledge:
    GenesisKnowledgeReadiness;

  chronology:
    GenesisChronologyReadiness;

  authority:
    GenesisAuthorityReadiness;

  education:
    GenesisEducationalReadiness;

  blockers:
    readonly GenesisReadinessBlocker[];

  completionPercentage:
    null;
}

export interface BuildGenesisReadinessInput {
  policy:
    GenesisReadinessPolicy;

  corpus:
    GenesisCorpusReadModel;

  chronology:
    GenesisTemporalChronology;

  documentationGovernance:
    GenesisDocumentationGovernanceProjection;

  knowledgeLifecycle:
    GenesisKnowledgeLifecycleProjection;
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
          (
            key,
          ) => [
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

function sortedUnique<
  T extends string,
>(
  values:
    readonly T[],
): readonly T[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}

function sourceCoverage(
  input:
    BuildGenesisReadinessInput,
): GenesisSourceCoverageReadiness {
  const requiredSourceClasses =
    sortedUnique(
      input.policy
        .requiredSourceClasses,
    );

  const presentRequiredSourceClasses =
    requiredSourceClasses.filter(
      (
        sourceClass,
      ) =>
        (
          input.corpus
            .sourceSummary
            .byClass[
              sourceClass
            ] ??
          0
        ) >
        0,
    );

  const missingRequiredSourceClasses =
    requiredSourceClasses.filter(
      (
        sourceClass,
      ) =>
        !presentRequiredSourceClasses
          .includes(
            sourceClass,
          ),
    );

  const externalGap =
    input.corpus
      .externalContext
      .pendingEpisodes >
      0 ||
    input.corpus
      .externalContext
      .notYetIngestedConversationSources >
      0;

  return {
    state:
      missingRequiredSourceClasses
        .length >
        0 ||
      externalGap
        ? "partial"
        : "complete",

    discoveredSourceRevisions:
      input.corpus
        .sourceSummary
        .sourceRevisions,

    requiredSourceClasses,

    presentRequiredSourceClasses,

    missingRequiredSourceClasses,

    externalSourceReferences:
      input.corpus
        .externalContext
        .externalSourceReferences,

    pendingExternalContextEpisodes:
      input.corpus
        .externalContext
        .pendingEpisodes,

    notYetIngestedConversationSources:
      input.corpus
        .externalContext
        .notYetIngestedConversationSources,
  };
}

function replayCoverage(
  corpus:
    GenesisCorpusReadModel,
): GenesisReplayCoverageReadiness {
  const completedReplays =
    corpus.replays.filter(
      (
        replay,
      ) =>
        replay.executionStatus ===
        "completed",
    ).length;

  const blockedReplays =
    corpus.replays.filter(
      (
        replay,
      ) =>
        replay.executionStatus ===
        "blocked",
    ).length;

  const failedReplays =
    corpus.replays.filter(
      (
        replay,
      ) =>
        replay.executionStatus ===
        "failed",
    ).length;

  const runningReplays =
    corpus.replays.filter(
      (
        replay,
      ) =>
        replay.executionStatus ===
        "running",
    ).length;

  const pendingReplays =
    corpus.replays.filter(
      (
        replay,
      ) =>
        replay.executionStatus ===
        "pending",
    ).length;

  return {
    state:
      blockedReplays >
        0 ||
      failedReplays >
        0
        ? "blocked"
        : corpus.replays
              .length ===
            0 ||
          completedReplays !==
            corpus.replays
              .length
          ? "partial"
          : "unavailable",

    replayCount:
      corpus.replays.length,

    completedReplays,

    blockedReplays,

    failedReplays,

    runningReplays,

    pendingReplays,

    manifestSources:
      corpus.replays.reduce(
        (
          total,
          replay,
        ) =>
          total +
          replay
            .totalManifestSources,
        0,
      ),

    sourcesReplayed:
      null,

    sourcesReplayedMeasurement:
      "unavailable",
  };
}

function knowledgeReadiness(
  lifecycle:
    GenesisKnowledgeLifecycleProjection,
): GenesisKnowledgeReadiness {
  const failed =
    lifecycle.records.filter(
      (
        record,
      ) =>
        record.manufacturingStatus ===
        "failed",
    ).length;

  const blocked =
    lifecycle.records.filter(
      (
        record,
      ) =>
        record.manufacturingStatus ===
        "blocked",
    ).length;

  return {
    state:
      failed >
        0 ||
      blocked >
        0
        ? "blocked"
        : lifecycle.summary
              .manufacturingAmbiguous >
            0 ||
          lifecycle.summary
              .manufacturingUncorrelated >
            0 ||
          lifecycle.summary
              .awaitingCanonicalReview >
            0
          ? "partial"
          : "complete",

    evidenceAdmitted:
      lifecycle.summary
        .admittedEvidence,

    manufacturingCorrelated:
      lifecycle.summary
        .manufacturingCorrelated,

    manufacturingAmbiguous:
      lifecycle.summary
        .manufacturingAmbiguous,

    manufacturingUncorrelated:
      lifecycle.summary
        .manufacturingUncorrelated,

    knowledgeIRReached:
      lifecycle.summary
        .knowledgeIRReached,

    validated:
      lifecycle.summary
        .validated,

    packaged:
      lifecycle.summary
        .packaged,

    awaitingCanonicalReview:
      lifecycle.summary
        .awaitingCanonicalReview,

    canonical:
      lifecycle.summary
        .canonical,

    memoryCorrelatedCanonicalItems:
      lifecycle.summary
        .memoryCorrelatedCanonicalItems,

    memoryAdaptationValidated:
      lifecycle.summary
        .memoryAdaptationValidated,

    failed,

    blocked,

    educationalEligibilityEvaluated:
      lifecycle.summary
        .educationalEligibilityEvaluated,
  };
}

function chronologyReadiness(
  chronology:
    GenesisTemporalChronology,
): GenesisChronologyReadiness {
  return {
    state:
      chronology.coverage
        .complete
        ? "complete"
        : "partial",

    historicalEvents:
      chronology.coverage
        .totalEvents,

    earliestOccurredAt:
      chronology.coverage
        .earliestOccurredAt,

    latestOccurredAt:
      chronology.coverage
        .latestOccurredAt,

    sourceRevisionsWithoutHistoricalEvents:
      chronology.coverage
        .sourceRevisionsWithoutHistoricalEvents
        .length,

    externalContextPendingEpisodes:
      chronology.coverage
        .episodesWithExternalContextPending
        .length,

    conflictedEpisodes:
      chronology.coverage
        .conflictedEpisodes
        .length,

    unresolvedRelationships:
      chronology.coverage
        .unresolvedRelationshipIds
        .length,
  };
}

function authorityReadiness(
  governance:
    GenesisDocumentationGovernanceProjection,
): GenesisAuthorityReadiness {
  return {
    state:
      governance.summary
          .unresolved >
        0 ||
      governance.summary
          .missingScope >
        0 ||
      governance.summary
          .missingEffectivePeriod >
        0
        ? "partial"
        : "complete",

    documents:
      governance.summary
        .documents,

    governing:
      governance.summary
        .governing,

    unresolved:
      governance.summary
        .unresolved,

    missingScope:
      governance.summary
        .missingScope,

    missingEffectivePeriod:
      governance.summary
        .missingEffectivePeriod,
  };
}

function blocker(
  code:
    GenesisReadinessBlockerCode,

  count:
    number,

  detail:
    string,
): GenesisReadinessBlocker | null {
  return count >
    0
    ? {
        code,
        count,
        detail,
      }
    : null;
}

function blockersFor(
  sources:
    GenesisSourceCoverageReadiness,

  replay:
    GenesisReplayCoverageReadiness,

  knowledge:
    GenesisKnowledgeReadiness,

  chronology:
    GenesisChronologyReadiness,

  authority:
    GenesisAuthorityReadiness,
): readonly GenesisReadinessBlocker[] {
  const conversationRequired =
    sources
      .requiredSourceClasses
      .includes(
        "conversation",
      );

  return [
    blocker(
      "required-source-class-missing",
      sources
        .missingRequiredSourceClasses
        .length,
      "Policy-required historical source classes are absent.",
    ),

    blocker(
      "external-conversation-not-ingested",
      conversationRequired
        ? sources
              .notYetIngestedConversationSources >
            0
          ? sources
              .notYetIngestedConversationSources
          : sources
              .missingRequiredSourceClasses
              .includes(
                "conversation",
              )
            ? 1
            : 0
        : 0,
      "Required historical conversation coverage is unavailable.",
    ),

    blocker(
      "external-context-pending",
      sources
        .pendingExternalContextEpisodes,
      "Evolution Episodes still require external historical context.",
    ),

    blocker(
      "replay-blocked",
      replay.blockedReplays,
      "Historical Replay is blocked.",
    ),

    blocker(
      "replay-failed",
      replay.failedReplays,
      "Historical Replay failed.",
    ),

    blocker(
      "replay-incomplete",
      replay.runningReplays +
      replay.pendingReplays,
      "Historical Replay is still incomplete.",
    ),

    blocker(
      "replayed-source-count-unavailable",
      1,
      "Exact source-level replay coverage is not yet projected by the certified Corpus.",
    ),

    blocker(
      "chronology-gap",
      chronology
        .sourceRevisionsWithoutHistoricalEvents,
      "Source revisions exist without Historical Event projection.",
    ),

    blocker(
      "chronology-conflict",
      chronology
        .conflictedEpisodes,
      "Evolution Episodes remain conflicted.",
    ),

    blocker(
      "correlation-unresolved",
      chronology
        .unresolvedRelationships,
      "Historical Relationships remain unresolved.",
    ),

    blocker(
      "documentation-authority-unresolved",
      authority.unresolved,
      "Documentation authority remains unresolved.",
    ),

    blocker(
      "documentation-scope-missing",
      authority.missingScope,
      "Governed documentation lacks authority scope.",
    ),

    blocker(
      "documentation-effective-period-missing",
      authority
        .missingEffectivePeriod,
      "Governed documentation lacks declared effective period.",
    ),

    blocker(
      "manufacturing-correlation-ambiguous",
      knowledge
        .manufacturingAmbiguous,
      "Evidence correlates to multiple manufacturing runs.",
    ),

    blocker(
      "manufacturing-correlation-missing",
      knowledge
        .manufacturingUncorrelated,
      "Evidence lacks a correlated manufacturing run.",
    ),

    blocker(
      "knowledge-manufacturing-failed",
      knowledge.failed,
      "Knowledge Manufacturing failed.",
    ),

    blocker(
      "knowledge-manufacturing-blocked",
      knowledge.blocked,
      "Knowledge Manufacturing is blocked.",
    ),

    blocker(
      "canonical-review-pending",
      knowledge
        .awaitingCanonicalReview,
      "Knowledge Packages await Canonical Review.",
    ),

    blocker(
      "educational-eligibility-not-evaluated",
      1,
      "CA-005 educational eligibility has not yet been evaluated.",
    ),
  ]
    .filter(
      (
        item,
      ): item is
        GenesisReadinessBlocker =>
          item !==
          null,
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.code.localeCompare(
          right.code,
        ),
    );
}

export function buildGenesisReadiness(
  input:
    BuildGenesisReadinessInput,
): GenesisReadinessProjection {
  const sources =
    sourceCoverage(
      input,
    );

  const replay =
    replayCoverage(
      input.corpus,
    );

  const knowledge =
    knowledgeReadiness(
      input.knowledgeLifecycle,
    );

  const chronology =
    chronologyReadiness(
      input.chronology,
    );

  const authority =
    authorityReadiness(
      input.documentationGovernance,
    );

  const education:
    GenesisEducationalReadiness = {
      state:
        "not-evaluated",

      eligibleRecords:
        null,

      reason:
        "CA-005 educational eligibility not yet evaluated",
    };

  const blockers =
    blockersFor(
      sources,
      replay,
      knowledge,
      chronology,
      authority,
    );

  const overall:
    GenesisOverallReadiness =
      replay.state ===
        "blocked" ||
      knowledge.state ===
        "blocked"
        ? "blocked"
        : blockers.length >
            0
          ? "incomplete"
          : "ready";

  const projectionId =
    `genesis-readiness:${hash({
      policyId:
        input.policy
          .policyId,

      requiredSourceClasses:
        sources
          .requiredSourceClasses,

      corpusProjectionId:
        input.corpus
          .projectionId,

      chronologyProjectionId:
        input.chronology
          .projectionId,

      documentationGovernanceProjectionId:
        input
          .documentationGovernance
          .projectionId,

      knowledgeLifecycleProjectionId:
        input
          .knowledgeLifecycle
          .projectionId,

      sources,

      replay,

      knowledge,

      chronology,

      authority,

      education,

      blockers,
    })}` as GenesisReadinessProjectionId;

  return {
    projectionId,

    policyId:
      input.policy
        .policyId,

    overall,

    sources,

    replay,

    knowledge,

    chronology,

    authority,

    education,

    blockers,

    completionPercentage:
      null,
  };
}
