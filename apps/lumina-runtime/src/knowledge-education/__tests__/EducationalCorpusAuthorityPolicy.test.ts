import assert from "node:assert/strict";
import test from "node:test";

import {
  assessEducationalCorpusAuthority,
} from "../EducationalCorpusAuthorityPolicy.js";

import {
  buildEducationalCorpusSourceContract,
} from "../EducationalCorpusSourceContract.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

import type {
  GenesisDayZeroCertification,
  GenesisDayZeroCertificationRuntimeProjection,
} from "../../knowledge-preservation/genesis/index.js";


function artifact(
  patch: Partial<
    EducationalArtifactProjection
  > = {},
): EducationalArtifactProjection {
  return {
    id:
      "artifact-001",

    title:
      "Platform Constitution",

    kind:
      "constitution",

    category:
      "Constitution",

    authorityClass:
      "constitutional",

    approvalState:
      "approved",

    owner:
      "Constitutional Office",

    scope:
      "platform",

    version:
      "1.0.0",

    provenance:
      "docs/architecture/00_PLATFORM_CONSTITUTION.md",

    source:
      "canonical-knowledge",

    sourceRefs: [
      "docs/architecture/00_PLATFORM_CONSTITUTION.md",
    ],

    lineage:
      [],

    dependencies:
      [],

    supersession:
      "",

    educationalStatus:
      "completed",

    educationalImpact:
      "Platform governance.",

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [],

    relatedCanonicalKnowledge: [
      "artifact-001",
    ],

    relatedMemory:
      [],

    relatedMissions:
      [],

    relatedDecisions:
      [],

    authors:
      [],

    ...patch,
  };
}


function dayZero(
  state:
    "VALID" |
    "STALE" |
    "BLOCKED" |
    "UNSET" =
      "VALID",
): GenesisDayZeroCertificationRuntimeProjection {
  const certification:
    GenesisDayZeroCertification |
    null =
    state ===
      "UNSET"
      ? null
      : {
          certificationId:
            "genesis-day-zero-certification:test",

          certificationVersion:
            "genesis-day-zero-certification:v1" as const,

          state:
            "CERTIFIED" as const,

          candidateId:
            "genesis-day-zero-certification-candidate:test",

          certifiedBy:
            "human",

          certifiedAt:
            1000,

          reason:
            "accepted",

          provenance: {
            repositorySeedCertificationId:
              "repository-certification",

            corpusProjectionId:
              "corpus",

            conversationExpectedInventoryId:
              "expected",

            conversationAcquisitionInventoryId:
              "acquisition",

            conversationCorrelationProjectionId:
              "correlation",
          },

          certifiedHistoricalGaps: {
            historicallyUnavailableConversationIds:
              [],
          },

          downstream: {
            educationalCorpusCertified:
              false as const,

            initialCompetencyCertified:
              false as const,

            chiefAgentActivationAuthorized:
              false as const,
          },
        };

  return {
    state,

    candidate: {
      candidateId:
        "genesis-day-zero-certification-candidate:test",

      state:
        state ===
          "BLOCKED"
          ? "BLOCKED"
          : "READY",

      repositoryNative: {
        certificationId:
          "genesis-repository-seed-certification:test",

        state:
          "CERTIFIED",

        replayExact:
          true,

        totalSources:
          1,

        completedSources:
          1,

        blockedSources:
          0,
      },

      conversationHistory: {
        expectedHistoryPresent:
          true,

        expectedInventoryId:
          "expected",

        acquisitionInventoryId:
          "acquisition",

        reconciliationState:
          "COMPLETE",

        authorityId:
          "authority",

        authorityVersion:
          "1",

        expectedRecoverableConversationIds:
          [],

        acquiredExpectedConversationIds:
          [],

        notYetAcquiredConversationIds:
          [],

        historicallyUnavailableConversationIds:
          [],

        unexpectedAcquiredConversationIds:
          [],
      },

      correlation: {
        projectionId:
          "genesis-conversation-correlation-completeness:test",

        state:
          "COMPLETE",

        conversationManifestSources:
          0,

        admittedConversationSources:
          0,

        correlatedConversationSources:
          0,

        correlatedConversationEvents:
          0,

        unresolvedExplicitLinks:
          0,

        episodeLineageGaps:
          0,
      },

      corpus: {
        projectionId:
          "genesis-corpus-projection:test",

        sourceRevisions:
          1,

        historicalEvents:
          1,

        relationships:
          0,

        evolutionEpisodes:
          0,

        pendingExternalEpisodes:
          0,
      },

      provenance: {
        repositorySeedCertificationId:
          "repository-certification",

        corpusProjectionId:
          "corpus",

        conversationExpectedInventoryId:
          "expected",

        conversationAcquisitionInventoryId:
          "acquisition",

        conversationCorrelationProjectionId:
          "correlation",
      },

      visibleHistoricalGaps: {
        historicallyUnavailableConversationIds:
          [],

        notYetAcquiredConversationIds:
          [],

        unexpectedAcquiredConversationIds:
          [],

        unresolvedExplicitHistoricalLinks:
          [],

        episodeLineageGaps:
          [],
      },

      blockers:
        [],

      dayZeroGenesisCertified:
        false,
    },

    certification,

    validation:
      state ===
        "VALID"
        ? {
            state:
              "VALID",

            certificationId:
              "genesis-day-zero-certification:test",

            currentCandidateId:
              "genesis-day-zero-certification-candidate:test",

            blockers:
              [],
          }
        : null,

    downstream: {
      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },

    approval: {
      projectionId:
        "genesis-day-zero-certification-approval:test",

      state:
        state ===
          "VALID"
          ? "CERTIFIED"
          : state ===
              "STALE"
            ? "STALE"
            : state ===
                "BLOCKED"
              ? "BLOCKED"
              : "EXCEPTIONS_PRESENT",

      certificationState:
        state,

      candidateId:
        "genesis-day-zero-certification-candidate:test",

      summary: {
        repositorySources:
          1,

        repositorySourcesCompleted:
          1,

        expectedRecoverableConversations:
          0,

        acquiredExpectedConversations:
          0,

        conversationManifestSources:
          0,

        admittedConversationSources:
          0,

        correlatedConversationSources:
          0,

        correlatedConversationEvents:
          0,

        historicalEvents:
          1,

        relationships:
          0,

        evolutionEpisodes:
          0,

        historicallyUnavailableConversations:
          0,

        unresolvedExceptions:
          0,
      },

      acknowledgedHistoricalGaps:
        [],

      exceptions:
        [],

      approval: {
        singleHumanApprovalRequired:
          true,

        perConversationApprovalRequired:
          false,

        available:
          false,

        reason:
          "test",
      },

      downstream: {
        educationalCorpusCertified:
          false,

        initialCompetencyCertified:
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    },
  };
}


test(
  "valid Day-0 certification is mandatory for Educational Corpus authority admission",
  () => {
    const result =
      assessEducationalCorpusAuthority({
        artifact:
          artifact(),

        dayZero:
          dayZero(
            "STALE",
          ),
      });

    assert.equal(
      result.decision,
      "BLOCKED",
    );

    assert.equal(
      result.learningRole,
      null,
    );
  },
);


test(
  "constitutional artifacts receive constitutional curriculum role when authority is complete",
  () => {
    const result =
      assessEducationalCorpusAuthority({
        artifact:
          artifact(),

        dayZero:
          dayZero(),
      });

    assert.equal(
      result.decision,
      "ELIGIBLE",
    );

    assert.equal(
      result.learningRole,
      "CONSTITUTIONAL_CURRICULUM",
    );
  },
);


test(
  "governing architecture receives governing architecture role",
  () => {
    const result =
      assessEducationalCorpusAuthority({
        artifact:
          artifact({
            id:
              "architecture-001",

            kind:
              "architecture",

            title:
              "Chief Agent Architecture",
          }),

        dayZero:
          dayZero(),
      });

    assert.equal(
      result.decision,
      "ELIGIBLE",
    );

    assert.equal(
      result.learningRole,
      "GOVERNING_ARCHITECTURE",
    );
  },
);


test(
  "missing authority fields require review instead of inferred curriculum authority",
  () => {
    const result =
      assessEducationalCorpusAuthority({
        artifact:
          artifact({
            owner:
              "Unavailable",
          }),

        dayZero:
          dayZero(),
      });

    assert.equal(
      result.decision,
      "REQUIRES_AUTHORITY_REVIEW",
    );

    assert.equal(
      result.learningRole,
      null,
    );
  },
);


test(
  "approved conversation artifact does not become current truth merely because it is canonical",
  () => {
    const result =
      assessEducationalCorpusAuthority({
        artifact:
          artifact({
            id:
              "conversation-001",

            kind:
              "conversation",

            title:
              "Architecture discussion",

            educationalStatus:
              "completed",
          }),

        dayZero:
          dayZero(),
      });

    assert.equal(
      result.decision,
      "REQUIRES_AUTHORITY_REVIEW",
    );

    assert.equal(
      result.learningRole,
      null,
    );

    assert.ok(
      result.reasons.includes(
        "educational-learning-role-not-explicitly-resolved",
      ),
    );
  },
);


test(
  "non-approved material is excluded from curriculum admission",
  () => {
    const result =
      assessEducationalCorpusAuthority({
        artifact:
          artifact({
            approvalState:
              "proposed",
          }),

        dayZero:
          dayZero(),
      });

    assert.equal(
      result.decision,
      "EXCLUDED",
    );
  },
);


test(
  "source contract is deterministic and remains uncertified",
  () => {
    const input = {
      artifacts: [
        artifact(),
        artifact({
          id:
            "decision-001",

          kind:
            "decision",

          title:
            "Architecture decision",
        }),
      ],

      dayZero:
        dayZero(),
    };

    const first =
      buildEducationalCorpusSourceContract(
        input,
      );

    const second =
      buildEducationalCorpusSourceContract(
        input,
      );

    assert.equal(
      first.contractId,
      second.contractId,
    );

    assert.equal(
      first.summary.eligible,
      2,
    );

    assert.equal(
      first.educationalCorpusCertified,
      false,
    );

    assert.equal(
      first.initialCompetencyCertified,
      false,
    );
  },
);


test(
  "source contract refuses assembly without current VALID Day-0 certification",
  () => {
    assert.throws(
      () =>
        buildEducationalCorpusSourceContract({
          artifacts: [
            artifact(),
          ],

          dayZero:
            dayZero(
              "BLOCKED",
            ),
        }),
      /valid_day_zero_certification_required/,
    );
  },
);
