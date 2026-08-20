import {
  test,
} from "vitest";

import React from "react";

import {
  renderToString,
} from "react-dom/server";

import {
  GenesisOperationalProjectionPanel,
} from "../GenesisOperationalProjectionPanel";

import type {
  GenesisOperationalProjection,
  GenesisOperationalReadState,
  GenesisReplayId,
} from "@/services/runtime/genesisReplayRead";

const REPLAY =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

function normalize(
  html:
    string,
) {
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

function renderState(
  state:
    GenesisOperationalReadState,
) {
  return normalize(
    renderToString(
      React.createElement(
        GenesisOperationalProjectionPanel,
        {
          state,
        },
      ),
    ),
  );
}

function projection():
  GenesisOperationalProjection {
  return {
    projectionId:
      "genesis-operational:fixture",

    replayId:
      REPLAY,

    corpus: {
      projectionId:
        "genesis-corpus-projection:fixture",

      sourceSummary: {
        uniqueSources:
          5,

        sourceRevisions:
          7,

        byClass:
          {},
      },

      evolutionSummary: {
        historicalEvents:
          12,

        relationships:
          8,

        evolutionEpisodes:
          3,

        conflictedEpisodes:
          1,

        incompleteEpisodes:
          1,

        validatedEpisodes:
          1,

        unresolvedRelationships:
          2,
      },

      knowledgeLifecycle: {
        admittedEvidence:
          4,

        manufacturingLinkedEvidence:
          3,

        ambiguousManufacturingLinks:
          0,

        packages:
          2,

        canonicalKnowledge:
          1,
      },

      externalContext: {
        pendingEpisodes:
          2,

        notYetIngestedConversationSources:
          1,

        externalSourceReferences:
          1,

        complete:
          false,
      },

      replays:
        [],

      sources:
        [],

      events:
        [],

      relationships:
        [],

      episodes:
        [],
    },

    chronology: {
      projectionId:
        "genesis-chronology:fixture",

      corpusProjectionId:
        "genesis-corpus-projection:fixture",

      entries:
        [],

      coverage: {
        totalEvents:
          12,

        earliestOccurredAt:
          1,

        latestOccurredAt:
          12,

        sourceRevisionsWithoutHistoricalEvents: [
          "source-gap",
        ],

        episodesWithExternalContextPending: [
          "episode-pending",
        ],

        conflictedEpisodes: [
          "episode-conflict",
        ],

        unresolvedRelationshipIds: [
          "relationship-gap",
        ],

        complete:
          false,
      },
    },

    documentationGovernance: {
      projectionId:
        "genesis-document-governance:fixture",

      documents:
        [],

      summary: {
        documents:
          6,

        governing:
          2,

        evidentiary:
          1,

        planning:
          0,

        proposals:
          0,

        historical:
          1,

        superseded:
          2,

        unresolved:
          1,

        missingScope:
          1,

        missingEffectivePeriod:
          0,
      },
    },

    knowledgeLifecycle: {
      projectionId:
        "genesis-knowledge-lifecycle:fixture",

      corpusProjectionId:
        "genesis-corpus-projection:fixture",

      records:
        [],

      summary: {
        admittedEvidence:
          4,

        manufacturingCorrelated:
          3,

        manufacturingAmbiguous:
          0,

        manufacturingUncorrelated:
          1,

        knowledgeIRReached:
          3,

        validated:
          2,

        packaged:
          2,

        awaitingCanonicalReview:
          1,

        canonical:
          1,

        memoryCorrelatedCanonicalItems:
          1,

        memoryAdaptationValidated:
          1,

        educationalEligibilityEvaluated:
          0,
      },
    },

    readiness: {
      projectionId:
        "genesis-readiness:fixture",

      policyId:
        "genesis-readiness:v1",

      overall:
        "incomplete",

      sources: {
        state:
          "partial",

        discoveredSourceRevisions:
          7,

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
          2,

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
          7,

        sourcesReplayed:
          null,

        sourcesReplayedMeasurement:
          "unavailable",
      },

      knowledge: {
        state:
          "partial",

        evidenceAdmitted:
          4,

        manufacturingCorrelated:
          3,

        manufacturingAmbiguous:
          0,

        manufacturingUncorrelated:
          1,

        knowledgeIRReached:
          3,

        validated:
          2,

        packaged:
          2,

        awaitingCanonicalReview:
          1,

        canonical:
          1,

        memoryCorrelatedCanonicalItems:
          1,

        memoryAdaptationValidated:
          1,

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
          12,

        earliestOccurredAt:
          1,

        latestOccurredAt:
          12,

        sourceRevisionsWithoutHistoricalEvents:
          1,

        externalContextPendingEpisodes:
          2,

        conflictedEpisodes:
          1,

        unresolvedRelationships:
          2,
      },

      authority: {
        state:
          "partial",

        documents:
          6,

        governing:
          2,

        unresolved:
          1,

        missingScope:
          1,

        missingEffectivePeriod:
          0,
      },

      education: {
        state:
          "not-evaluated",

        eligibleRecords:
          null,

        reason:
          "CA-005 educational eligibility not yet evaluated",
      },

      blockers: [
        {
          code:
            "external-conversation-not-ingested",

          count:
            1,

          detail:
            "Historical conversations are unavailable.",
        },
      ],

      completionPercentage:
        null,
    },

    conversationSource: {
      projectionId:
        "genesis-conversation-boundary:fixture",

      classification:
        "SOURCE ACCESS BLOCKED",

      compiler: {
        available:
          true,

        compilerName:
          "conversation-compiler",

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
          "No governed historical conversation acquisition/source adapter is implemented.",
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

function readyState():
  GenesisOperationalReadState {
  return {
    replayId:
      REPLAY,

    projection:
      projection(),

    loading:
      false,

    loaded:
      true,

    error:
      null,
  };
}

test(
  "renders certified Genesis operational projection states",
  () => {
    const ready =
      renderState(
        readyState(),
      );

for (
  const value
  of [
    "Operational reconstruction",
    "Source revisions",
    "7",
    "Historical events",
    "12",
    "Evolution episodes",
    "3",
    "Documentation governance",
    "Knowledge Operations lifecycle",
    "Historical conversations",
    "SOURCE ACCESS BLOCKED",
    "EXTERNAL SOURCE — NOT YET INGESTED",
    "Git does not substitute for Conversation Evidence",
    "Genesis readiness",
    "conversation",
    "Unavailable",
    "not-evaluated",
    "genesis-operational:fixture",
  ]
) {
  if (
    !ready.includes(
      value,
    )
  ) {
    throw new Error(
      `operational_panel_contract_missing:${value}`,
    );
  }
}

for (
  const forbidden
  of [
    "Start replay",
    "Resume replay",
    "Recover replay",
    "Admit Evidence",
    "Promote Canonical",
    "Activate Chief Agent",
  ]
) {
  if (
    ready.includes(
      forbidden,
    )
  ) {
    throw new Error(
      `operational_panel_mutation_control_detected:${forbidden}`,
    );
  }
}

const loading =
  renderState({
    replayId:
      REPLAY,

    projection:
      null,

    loading:
      true,

    loaded:
      false,

    error:
      null,
  });

if (
  !loading.includes(
    "Reading Genesis Corpus",
  )
) {
  throw new Error(
    "operational_panel_loading_contract_missing",
  );
}

const errored =
  renderState({
    replayId:
      REPLAY,

    projection:
      null,

    loading:
      false,

    loaded:
      true,

    error: {
      message:
        "genesis_operational_projection_correlation_not_found",

      code:
        "genesis_operational_projection_correlation_not_found",

      status:
        409,

      replayId:
        REPLAY,
    },
  });

for (
  const value
  of [
    "Operational integrity",
    "Operational projection unavailable",
    "genesis_operational_projection_correlation_not_found",
    "HTTP 409",
  ]
) {
  if (
    !errored.includes(
      value,
    )
  ) {
    throw new Error(
      `operational_panel_error_contract_missing:${value}`,
    );
  }
}
  },
);
