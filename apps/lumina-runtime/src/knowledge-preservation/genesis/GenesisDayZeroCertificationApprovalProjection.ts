import {
  createHash,
} from "node:crypto";

import type {
  GenesisDayZeroCertificationRuntimeProjection,
} from "./GenesisDayZeroCertificationService.js";


export type GenesisDayZeroCertificationApprovalProjectionId =
  `genesis-day-zero-certification-approval:${string}`;


export type GenesisDayZeroCertificationApprovalInput =
  Omit<
    GenesisDayZeroCertificationRuntimeProjection,
    "approval"
  >;


export type GenesisDayZeroCertificationApprovalState =
  | "READY_FOR_SINGLE_APPROVAL"
  | "CERTIFIED"
  | "EXCEPTIONS_PRESENT"
  | "BLOCKED"
  | "STALE";


export interface GenesisDayZeroCertificationException {
  code:
    string;

  category:
    "repository"
    | "conversation-acquisition"
    | "conversation-correlation"
    | "historical-link"
    | "episode-lineage"
    | "certification";

  subjectId:
    string | null;

  relatedId:
    string | null;
}


export interface GenesisDayZeroCertificationApprovalProjection {
  projectionId:
    GenesisDayZeroCertificationApprovalProjectionId;

  state:
    GenesisDayZeroCertificationApprovalState;

  certificationState:
    GenesisDayZeroCertificationRuntimeProjection[
      "state"
    ];

  candidateId:
    string;

  summary: {
    repositorySources:
      number | null;

    repositorySourcesCompleted:
      number | null;

    expectedRecoverableConversations:
      number;

    acquiredExpectedConversations:
      number;

    conversationManifestSources:
      number;

    admittedConversationSources:
      number;

    correlatedConversationSources:
      number;

    correlatedConversationEvents:
      number;

    historicalEvents:
      number;

    relationships:
      number;

    evolutionEpisodes:
      number;

    historicallyUnavailableConversations:
      number;

    unresolvedExceptions:
      number;
  };

  acknowledgedHistoricalGaps:
    readonly string[];

  exceptions:
    readonly GenesisDayZeroCertificationException[];

  approval: {
    singleHumanApprovalRequired:
      true;

    perConversationApprovalRequired:
      false;

    available:
      boolean;

    reason:
      string;
  };

  downstream: {
    educationalCorpusCertified:
      false;

    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
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


function exception(
  input: {
    code:
      string;

    category:
      GenesisDayZeroCertificationException[
        "category"
      ];

    subjectId?:
      string | null;

    relatedId?:
      string | null;
  },
): GenesisDayZeroCertificationException {
  return {
    code:
      input.code,

    category:
      input.category,

    subjectId:
      input.subjectId ??
      null,

    relatedId:
      input.relatedId ??
      null,
  };
}


function compareException(
  left:
    GenesisDayZeroCertificationException,

  right:
    GenesisDayZeroCertificationException,
): number {
  return left.category.localeCompare(
    right.category,
  ) ||
  left.code.localeCompare(
    right.code,
  ) ||
  (
    left.subjectId ??
    ""
  ).localeCompare(
    right.subjectId ??
    "",
  ) ||
  (
    left.relatedId ??
    ""
  ).localeCompare(
    right.relatedId ??
    "",
  );
}


export function buildGenesisDayZeroCertificationApprovalProjection(
  runtime:
    GenesisDayZeroCertificationApprovalInput,
): GenesisDayZeroCertificationApprovalProjection {
  const candidate =
    runtime.candidate;

  const exceptions:
    GenesisDayZeroCertificationException[] =
      [];

  for (
    const blocker
    of candidate.blockers
  ) {
    exceptions.push(
      exception({
        code:
          blocker,

        category:
          blocker.includes(
            "repository",
          )
            ? "repository"
            : blocker.includes(
                "correlation",
              )
              ? "conversation-correlation"
              : "conversation-acquisition",
      }),
    );
  }

  for (
    const conversationId
    of candidate
      .visibleHistoricalGaps
      .notYetAcquiredConversationIds
  ) {
    exceptions.push(
      exception({
        code:
          "conversation-not-yet-acquired",

        category:
          "conversation-acquisition",

        subjectId:
          conversationId,
      }),
    );
  }

  for (
    const conversationId
    of candidate
      .visibleHistoricalGaps
      .unexpectedAcquiredConversationIds
  ) {
    exceptions.push(
      exception({
        code:
          "unexpected-acquired-conversation",

        category:
          "conversation-acquisition",

        subjectId:
          conversationId,
      }),
    );
  }

  for (
    const link
    of candidate
      .visibleHistoricalGaps
      .unresolvedExplicitHistoricalLinks
  ) {
    exceptions.push(
      exception({
        code:
          `unresolved-${link.relationship}`,

        category:
          "historical-link",

        subjectId:
          link.sourceHistoricalSourceId,

        relatedId:
          link.targetHistoricalSourceId,
      }),
    );
  }

  for (
    const gap
    of candidate
      .visibleHistoricalGaps
      .episodeLineageGaps
  ) {
    exceptions.push(
      exception({
        code:
          gap.reason,

        category:
          "episode-lineage",

        subjectId:
          gap.episodeId,

        relatedId:
          gap.revisionId,
      }),
    );
  }

  /*
   * Validation blockers belong to the persisted certification.
   *
   * When that certification is STALE but the current authoritative
   * candidate is READY, those blockers describe why the old
   * certification no longer matches current authority. They are not
   * defects in the current candidate and must not prevent governed
   * re-certification.
   */
  if (
    runtime.validation &&
    runtime.state !==
      "STALE"
  ) {
    for (
      const blocker
      of runtime.validation
        .blockers
    ) {
      exceptions.push(
        exception({
          code:
            blocker,

          category:
            "certification",
        }),
      );
    }
  }

  const deduplicated =
    [
      ...new Map(
        exceptions
          .map(
            item => [
              JSON.stringify(
                item,
              ),
              item,
            ],
          ),
      ).values(),
    ]
      .sort(
        compareException,
      );

  const approvalAvailable =
    (
      runtime.state ===
        "UNSET" ||
      runtime.state ===
        "STALE"
    ) &&
    candidate.state ===
      "READY" &&
    deduplicated.length ===
      0;

  const staleReadyForReCertification =
    runtime.state ===
      "STALE" &&
    candidate.state ===
      "READY" &&
    deduplicated.length ===
      0;

  const state:
    GenesisDayZeroCertificationApprovalState =
      runtime.state ===
        "VALID"
        ? "CERTIFIED"
        : staleReadyForReCertification
          ? "READY_FOR_SINGLE_APPROVAL"
          : runtime.state ===
              "STALE"
            ? "STALE"
            : runtime.state ===
                "BLOCKED" ||
              candidate.state ===
                "BLOCKED"
              ? "BLOCKED"
              : deduplicated.length >
                  0 ||
                candidate.state !==
                  "READY"
                ? "EXCEPTIONS_PRESENT"
                : "READY_FOR_SINGLE_APPROVAL";

  const acknowledgedHistoricalGaps =
    runtime.certification
      ?.certifiedHistoricalGaps
      .historicallyUnavailableConversationIds ??
    candidate
      .visibleHistoricalGaps
      .historicallyUnavailableConversationIds;

  const approvalReason =
    state ===
      "READY_FOR_SINGLE_APPROVAL"
      ? runtime.state ===
          "STALE"
        ? "The persisted Day-0 certification is stale, but the current authoritative candidate satisfies all automated prerequisites. One human corpus-level re-certification approval may be issued."
        : "All automated Day-0 prerequisites are satisfied. One human corpus-level approval may be issued."
      : state ===
          "CERTIFIED"
        ? "Day-0 Genesis is certified and currently valid."
        : state ===
            "STALE"
          ? "The persisted certification no longer matches the current authoritative candidate."
          : state ===
              "BLOCKED"
            ? "Day-0 certification is blocked by authoritative prerequisite failure."
            : "Resolve the surfaced exceptions before the single corpus-level approval is available.";

  const summary = {
    repositorySources:
      candidate
        .repositoryNative
        .totalSources,

    repositorySourcesCompleted:
      candidate
        .repositoryNative
        .completedSources,

    expectedRecoverableConversations:
      candidate
        .conversationHistory
        .expectedRecoverableConversationIds
        .length,

    acquiredExpectedConversations:
      candidate
        .conversationHistory
        .acquiredExpectedConversationIds
        .length,

    conversationManifestSources:
      candidate
        .correlation
        .conversationManifestSources,

    admittedConversationSources:
      candidate
        .correlation
        .admittedConversationSources,

    correlatedConversationSources:
      candidate
        .correlation
        .correlatedConversationSources,

    correlatedConversationEvents:
      candidate
        .correlation
        .correlatedConversationEvents,

    historicalEvents:
      candidate
        .corpus
        .historicalEvents,

    relationships:
      candidate
        .corpus
        .relationships,

    evolutionEpisodes:
      candidate
        .corpus
        .evolutionEpisodes,

    historicallyUnavailableConversations:
      candidate
        .visibleHistoricalGaps
        .historicallyUnavailableConversationIds
        .length,

    unresolvedExceptions:
      deduplicated.length,
  };

  const projectionId =
    `genesis-day-zero-certification-approval:${hash({
      certificationState:
        runtime.state,

      candidateId:
        candidate.candidateId,

      certificationId:
        runtime.certification
          ?.certificationId ??
        null,

      summary,

      acknowledgedHistoricalGaps,

      exceptions:
        deduplicated,

      approvalAvailable,
    })}` as GenesisDayZeroCertificationApprovalProjectionId;

  return {
    projectionId,

    state,

    certificationState:
      runtime.state,

    candidateId:
      candidate.candidateId,

    summary,

    acknowledgedHistoricalGaps: [
      ...acknowledgedHistoricalGaps,
    ].sort(),

    exceptions:
      deduplicated,

    approval: {
      singleHumanApprovalRequired:
        true,

      perConversationApprovalRequired:
        false,

      available:
        approvalAvailable,

      reason:
        approvalReason,
    },

    downstream: {
      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}
