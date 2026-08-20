import React from "react";

import {
  renderToString,
} from "react-dom/server";

import {
  describe,
  expect,
  test,
} from "vitest";

import {
  GenesisHistoricalArtifactExplorer,
} from "../GenesisHistoricalArtifactExplorer";

import type {
  GenesisOperationalProjection,
} from "@/services/runtime/genesisReplayRead";


function normalizeRenderedHtml(
  html:
    string,
): string {
  return html
    .replace(
      /<!-- -->/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    );
}

const replayId =
  `genesis-replay:${"a".repeat(
    64,
  )}` as const;

function fixture():
  GenesisOperationalProjection {
  return {
    projectionId:
      "genesis-operational:artifact-test",

    replayId,

    corpus: {
      projectionId:
        "genesis-corpus-projection:artifact-test",

      sourceSummary: {
        uniqueSources:
          2,

        sourceRevisions:
          2,

        byClass: {
          "architecture-document":
            1,

          commit:
            1,
        },
      },

      evolutionSummary: {
        historicalEvents:
          2,

        relationships:
          1,

        evolutionEpisodes:
          1,

        conflictedEpisodes:
          0,

        incompleteEpisodes:
          0,

        validatedEpisodes:
          1,

        unresolvedRelationships:
          0,
      },

      knowledgeLifecycle: {
        admittedEvidence:
          0,

        manufacturingLinkedEvidence:
          0,

        ambiguousManufacturingLinks:
          0,

        packages:
          0,

        canonicalKnowledge:
          0,
      },

      externalContext: {
        pendingEpisodes:
          1,

        notYetIngestedConversationSources:
          1,

        externalSourceReferences:
          1,

        complete:
          false,
      },

      replays:
        [],

      sources: [
        {
          sourceReferenceId:
            "genesis-source-ref:architecture",

          sourceRevisionId:
            "genesis-source-revision:architecture",

          sourceIdentity:
            "docs/architecture/GENESIS.md",

          sourceClass:
            "architecture-document",

          evidenceType:
            "document",

          externalSource:
            false,

          acquisitionState:
            "acquired",

          provenance: {
            locator:
              "docs/architecture/GENESIS.md",

            repository:
              "korelumina",

            externalSource:
              false,
          },

          eventIds: [
            "genesis-event:document-created",
          ],

          episodeIds: [
            "genesis-episode:evolution",
          ],

          metadata:
            {},
        },
        {
          sourceReferenceId:
            "genesis-source-ref:commit",

          sourceRevisionId:
            "genesis-source-revision:commit",

          sourceIdentity:
            "abc123",

          sourceClass:
            "commit",

          evidenceType:
            "git",

          externalSource:
            false,

          acquisitionState:
            "acquired",

          provenance: {
            nativeId:
              "abc123",

            repository:
              "korelumina",

            externalSource:
              false,
          },

          eventIds: [
            "genesis-event:implementation",
          ],

          episodeIds: [
            "genesis-episode:evolution",
          ],

          metadata:
            {},
        },
      ],

      events: [
        {
          eventId:
            "genesis-event:document-created",

          kind:
            "document-created",

          observationKey:
            "document-created:genesis",

          occurredAt:
            1767225600000,

          sourceReferenceIds: [
            "genesis-source-ref:architecture",
          ],

          sourceRevisionIds: [
            "genesis-source-revision:architecture",
          ],

          summary:
            "Genesis architecture documented",

          temporalAuthority: {
            historical: {
              status:
                "historically-authoritative",
            },

            current: {
              status:
                "currently-authoritative",
            },
          },

          metadata:
            {},
        },
        {
          eventId:
            "genesis-event:implementation",

          kind:
            "implementation-committed",

          observationKey:
            "commit:abc123",

          occurredAt:
            1767229200000,

          sourceReferenceIds: [
            "genesis-source-ref:commit",
          ],

          sourceRevisionIds: [
            "genesis-source-revision:commit",
          ],

          summary:
            "Genesis implementation committed",

          temporalAuthority: {
            historical: {
              status:
                "historically-implemented",
            },

            current: {
              status:
                "currently-implemented",
            },
          },

          metadata:
            {},
        },
      ],

      relationships: [
        {
          relationshipId:
            "genesis-relationship:implemented",

          from: {
            kind:
              "event",

            id:
              "genesis-event:document-created",
          },

          to: {
            kind:
              "event",

            id:
              "genesis-event:implementation",
          },

          type:
            "implemented_by",

          causal:
            false,

          confidence:
            "strong",

          evidence: {
            mode:
              "structural-inference",

            confidence:
              "strong",

            sourceReferenceIds: [
              "genesis-source-ref:architecture",
              "genesis-source-ref:commit",
            ],

            assertions: [
              "scope-aligned",
            ],
          },
        },
      ],

      episodes: [
        {
          episodeId:
            "genesis-episode:evolution",

          revisionId:
            "genesis-episode-revision:evolution-v1",

          episodeKey:
            "genesis-evolution",

          title:
            "Genesis Historical Reconstruction",

          lifecycle:
            "validated",

          eventIds: [
            "genesis-event:document-created",
            "genesis-event:implementation",
          ],

          relationshipIds: [
            "genesis-relationship:implemented",
          ],

          sourceReferenceIds: [
            "genesis-source-ref:architecture",
            "genesis-source-ref:commit",
          ],

          externalContext:
            "pending",

          temporalAuthority: {
            historical: {
              status:
                "historically-validated",
            },

            current: {
              status:
                "currently-implemented",
            },
          },

          lineage: {
            mergedFrom:
              [],

            supersedes:
              [],
          },

          metadata:
            {},
        },
      ],
    },

    chronology: {
      projectionId:
        "genesis-chronology:artifact-test",

      corpusProjectionId:
        "genesis-corpus-projection:artifact-test",

      entries:
        [],

      coverage: {
        totalEvents:
          2,

        earliestOccurredAt:
          1767225600000,

        latestOccurredAt:
          1767229200000,

        sourceRevisionsWithoutHistoricalEvents:
          [],

        episodesWithExternalContextPending: [
          "genesis-episode:evolution",
        ],

        conflictedEpisodes:
          [],

        unresolvedRelationshipIds:
          [],

        complete:
          false,
      },
    },

    documentationGovernance: {
      projectionId:
        "genesis-documentation-governance:artifact-test",

      documents:
        [],

      summary: {
        documents:
          1,

        governing:
          1,

        evidentiary:
          0,

        planning:
          0,

        proposals:
          0,

        historical:
          0,

        superseded:
          0,

        unresolved:
          0,

        missingScope:
          0,

        missingEffectivePeriod:
          0,
      },
    },

    knowledgeLifecycle: {
      projectionId:
        "genesis-knowledge-lifecycle:artifact-test",

      corpusProjectionId:
        "genesis-corpus-projection:artifact-test",

      records:
        [],

      summary: {
        admittedEvidence:
          0,

        manufacturingCorrelated:
          0,

        manufacturingAmbiguous:
          0,

        manufacturingUncorrelated:
          0,

        knowledgeIRReached:
          0,

        validated:
          0,

        packaged:
          0,

        awaitingCanonicalReview:
          0,

        canonical:
          0,

        memoryCorrelatedCanonicalItems:
          0,

        memoryAdaptationValidated:
          0,

        educationalEligibilityEvaluated:
          0,
      },
    },

    readiness: {
      projectionId:
        "genesis-readiness:artifact-test",

      policyId:
        "genesis-readiness:v1",

      overall:
        "incomplete",

      sources: {
        state:
          "partial",

        discoveredSourceRevisions:
          2,

        requiredSourceClasses: [
          "architecture-document",
          "commit",
          "conversation",
        ],

        presentRequiredSourceClasses: [
          "architecture-document",
          "commit",
        ],

        missingRequiredSourceClasses: [
          "conversation",
        ],

        externalSourceReferences:
          1,

        pendingExternalContextEpisodes:
          1,

        notYetIngestedConversationSources:
          1,
      },

      replay: {
        state:
          "unavailable",

        replayCount:
          1,

        completedReplays:
          1,

        blockedReplays:
          0,

        failedReplays:
          0,

        runningReplays:
          0,

        pendingReplays:
          0,

        manifestSources:
          2,

        sourcesReplayed:
          null,

        sourcesReplayedMeasurement:
          "unavailable",
      },

      knowledge: {
        state:
          "partial",

        evidenceAdmitted:
          0,

        manufacturingCorrelated:
          0,

        manufacturingAmbiguous:
          0,

        manufacturingUncorrelated:
          0,

        knowledgeIRReached:
          0,

        validated:
          0,

        packaged:
          0,

        awaitingCanonicalReview:
          0,

        canonical:
          0,

        memoryCorrelatedCanonicalItems:
          0,

        memoryAdaptationValidated:
          0,

        failed:
          0,

        blocked:
          0,

        educationalEligibilityEvaluated:
          0,
      },

      chronology: {
        state:
          "partial",

        historicalEvents:
          2,

        earliestOccurredAt:
          1767225600000,

        latestOccurredAt:
          1767229200000,

        sourceRevisionsWithoutHistoricalEvents:
          0,

        externalContextPendingEpisodes:
          1,

        conflictedEpisodes:
          0,

        unresolvedRelationships:
          0,
      },

      authority: {
        state:
          "complete",

        documents:
          1,

        governing:
          1,

        unresolved:
          0,

        missingScope:
          0,

        missingEffectivePeriod:
          0,
      },

      education: {
        state:
          "not-evaluated",

        eligibleRecords:
          null,

        reason:
          "Educational eligibility has not been evaluated.",
      },

      blockers:
        [],

      completionPercentage:
        null,
    },

    conversationSource: {
      projectionId:
        "genesis-conversation-source:artifact-test",

      classification:
        "SOURCE ACCESS BLOCKED",

      compiler: {
        available:
          true,

        compilerName:
          "ConversationCompiler",

        evidenceType:
          "conversation",

        governedKnowledgePathAvailable:
          true,
      },

      acquisition: {
        available:
          false,

        state:
          "blocked",

        mechanism:
          null,

        blocker:
          "Historical conversation source access is unavailable.",
      },

      externalSourceMarker:
        "EXTERNAL SOURCE — NOT YET INGESTED",

      externalContextMarker:
        "EXTERNAL CONTEXT PENDING",

      repositoryReplayBlocked:
        false,

      conversationEvidenceMayBeSubstitutedByGit:
        false,
    },
  };
}

describe(
  "GenesisHistoricalArtifactExplorer",
  () => {
    test(
      "renders source, event, episode, and relationship inventory without mutation controls",
      () => {
        const html =
          normalizeRenderedHtml(
            renderToString(
              React.createElement(
                GenesisHistoricalArtifactExplorer,
                {
                  projection:
                    fixture(),
                },
              ),
            ),
          );

        for (
          const text
          of [
            "Historical artifact explorer",
            "Sources",
            "Events",
            "Evolution Episodes",
            "2 visible",
            "1 relationships",
            "docs/architecture/GENESIS.md",
            "architecture-document",
          ]
        ) {
          expect(
            html,
          ).toContain(
            text,
          );
        }

        for (
          const forbidden
          of [
            "Start replay",
            "Resume replay",
            "Recover replay",
            "Promote Canonical",
            "Activate Chief Agent",
          ]
        ) {
          expect(
            html,
          ).not.toContain(
            forbidden,
          );
        }
      },
    );

    test(
      "does not fabricate missing historical collections",
      () => {
        const value =
          fixture();

        value.corpus.sources =
          [];

        const html =
          normalizeRenderedHtml(
            renderToString(
              React.createElement(
                GenesisHistoricalArtifactExplorer,
                {
                  projection:
                    value,
                },
              ),
            ),
          );

        expect(
          html,
        ).toContain(
          "No Sources projected",
        );

        expect(
          html,
        ).toContain(
          "Genesis does not fabricate missing historical artifacts",
        );
      },
    );
  },
);
