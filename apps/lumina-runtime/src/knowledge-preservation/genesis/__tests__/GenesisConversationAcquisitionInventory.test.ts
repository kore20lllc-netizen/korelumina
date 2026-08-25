import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationAcquisitionInventory,
} from "../GenesisConversationAcquisitionInventory.js";

import {
  resolveGenesisConversationRuntimeConfiguration,
} from "../GenesisConversationRuntimeConfiguration.js";


test(
  "unconfigured conversation history is NOT_ACQUIRED",
  () => {
    const configuration =
      resolveGenesisConversationRuntimeConfiguration(
        {},
      );

    const inventory =
      buildGenesisConversationAcquisitionInventory({
        configuration,

        latest:
          null,
      });

    assert.equal(
      inventory.historyState,
      "UNCONFIGURED",
    );

    assert.equal(
      inventory.completeness,
      "NOT_ACQUIRED",
    );

    assert.equal(
      inventory.historicalCompletenessCertified,
      false,
    );
  },
);


test(
  "configured source without acquisition remains NOT_ACQUIRED",
  () => {
    const configuration = {
      state:
        "CONFIGURED" as const,

      sourceKind:
        "chatgpt-data-export" as const,

      configuredRoot:
        "/configured",

      resolvedRoot:
        "/configured",

      blocker:
        null,

      boundary: {
        projectionId:
          "genesis-conversation-boundary:test-boundary" as const,

        classification:
          "SUPPORTED AND INGESTIBLE" as const,

        compiler: {
          available:
            true,

          compilerName:
            "conversation-compiler",

            evidenceType:
              "conversation" as const,

          governedKnowledgePathAvailable:
            true,
        },

        acquisition: {
          available:
            true,

          state:
            "available" as const,

          mechanism:
            "chatgpt-data-export",
            blocker:
              null,

        },

        sourceContract: {
          conversationIdentity:
            "required" as const,

          projectAssociation:
            "required-when-available" as const,

          messageIdentity:
            "required" as const,

          timestamp:
            "required-when-available" as const,

          speakerRole:
            "required" as const,

          ordering:
            "required" as const,

          sourceReference:
            "required" as const,

          acquisitionEvent:
            "required" as const,

          integrityInformation:
            "required" as const,
        },

        repositoryReplayBlocked:
          false as const,

        conversationEvidenceMayBeSubstitutedByGit:
          false as const,

        externalSourceMarker:
          "EXTERNAL SOURCE — NOT YET INGESTED" as const,

        externalContextMarker:
          "EXTERNAL CONTEXT PENDING" as const,
      },

      source:
        null,

      adapter:
        null,
    };

    const inventory =
      buildGenesisConversationAcquisitionInventory({
        configuration,

        latest:
          null,
      });

    assert.equal(
      inventory.historyState,
      "NOT_ACQUIRED",
    );

    assert.equal(
      inventory.completeness,
      "NOT_ACQUIRED",
    );

    assert.deepEqual(
      inventory.blockers,
      [
        "conversation-acquisition-not-executed",
      ],
    );
  },
);


test(
  "successful acquisition without expected-history certification is UNVERIFIED",
  () => {
    const configuration =
      {
        state:
          "CONFIGURED" as const,

        sourceKind:
          "chatgpt-data-export" as const,

        configuredRoot:
          "/configured",

        resolvedRoot:
          "/configured",

        blocker:
          null,

        boundary: {
          projectionId:
            "genesis-conversation-boundary:test-boundary" as const,

          classification:
            "SUPPORTED AND INGESTIBLE" as const,

          compiler: {
            available:
              true,

            compilerName:
              "conversation-compiler",

            evidenceType:
              "conversation" as const,

            governedKnowledgePathAvailable:
              true,
          },

          acquisition: {
            available:
              true,

            state:
              "available" as const,

            mechanism:
              "chatgpt-data-export",

            blocker:
              null,
          },

          sourceContract: {
            conversationIdentity:
              "required" as const,

            projectAssociation:
              "required-when-available" as const,

            messageIdentity:
              "required" as const,

            timestamp:
              "required-when-available" as const,

            speakerRole:
              "required" as const,

            ordering:
              "required" as const,

            sourceReference:
              "required" as const,

            acquisitionEvent:
              "required" as const,

            integrityInformation:
              "required" as const,
          },

          repositoryReplayBlocked:
            false as const,

          conversationEvidenceMayBeSubstitutedByGit:
            false as const,

          externalSourceMarker:
            "EXTERNAL SOURCE — NOT YET INGESTED" as const,

          externalContextMarker:
            "EXTERNAL CONTEXT PENDING" as const,
        },

        source:
          null,

        adapter:
          null,
      };

    const inventory =
      buildGenesisConversationAcquisitionInventory({
        configuration,

        latest: {
          acquisitionId:
            "acquisition-1",

          state:
            "ACQUIRED",

          sourceId:
            "chatgpt",

          firstAcquiredAt:
            100,

          lastAcquiredAt:
            100,

          completedAt:
            101,

          occurrenceCount:
            1,

          occurrences: [
            {
              acquiredAt:
                100,

              completedAt:
                101,
            },
          ],

          conversationIds: [
            "conversation-2",
            "conversation-1",
          ],

          gaps:
            [],

          conversationCount:
            2,

          historicalSourceCount:
            4,

          evidenceCount:
            4,

          errors:
            [],

          historicalSources:
            [],

          evidence:
            [],
        },
      });

    assert.equal(
      inventory.historyState,
      "ACQUIRED",
    );

    assert.equal(
      inventory.completeness,
      "UNVERIFIED",
    );

    assert.deepEqual(
      inventory.acquiredConversationIds,
      [
        "conversation-1",
        "conversation-2",
      ],
    );

    assert.deepEqual(
      inventory.blockers,
      [
        "authoritative-conversation-history-inventory-not-certified",
      ],
    );

    assert.equal(
      inventory.historicalCompletenessCertified,
      false,
    );
  },
);


test(
  "not-yet-acquired and historically-unavailable remain separate gap classes",
  () => {
    const configuration =
      {
        state:
          "CONFIGURED" as const,

        sourceKind:
          "chatgpt-data-export" as const,

        configuredRoot:
          "/configured",

        resolvedRoot:
          "/configured",

        blocker:
          null,

        boundary: {
          projectionId:
            "genesis-conversation-boundary:test-boundary" as const,

          classification:
            "SUPPORTED AND INGESTIBLE" as const,

          compiler: {
            available:
              true,

            compilerName:
              "conversation-compiler",

            evidenceType:
              "conversation" as const,

            governedKnowledgePathAvailable:
              true,
          },

          acquisition: {
            available:
              true,

            state:
              "available" as const,

            mechanism:
              "chatgpt-data-export",

            blocker:
              null,
          },

          sourceContract: {
            conversationIdentity:
              "required" as const,

            projectAssociation:
              "required-when-available" as const,

            messageIdentity:
              "required" as const,

            timestamp:
              "required-when-available" as const,

            speakerRole:
              "required" as const,

            ordering:
              "required" as const,

            sourceReference:
              "required" as const,

            acquisitionEvent:
              "required" as const,

            integrityInformation:
              "required" as const,
          },

          repositoryReplayBlocked:
            false as const,

          conversationEvidenceMayBeSubstitutedByGit:
            false as const,

          externalSourceMarker:
            "EXTERNAL SOURCE — NOT YET INGESTED" as const,

          externalContextMarker:
            "EXTERNAL CONTEXT PENDING" as const,
        },

        source:
          null,

        adapter:
          null,
      };

    const inventory =
      buildGenesisConversationAcquisitionInventory({
        configuration,

        latest: {
          acquisitionId:
            "acquisition-gapped",

          state:
            "ACQUIRED",

          sourceId:
            "chatgpt",

          firstAcquiredAt:
            100,

          lastAcquiredAt:
            100,

          completedAt:
            101,

          occurrenceCount:
            1,

          occurrences: [
            {
              acquiredAt:
                100,

              completedAt:
                101,
            },
          ],

          conversationIds: [
            "conversation-1",
          ],

          gaps: [
            {
              state:
                "not-yet-acquired",

              conversationId:
                "conversation-2",

              detail:
                "Known source not imported.",
            },

            {
              state:
                "historically-unavailable",

              conversationId:
                "conversation-3",

              detail:
                "Known source cannot be recovered.",
            },
          ],

          conversationCount:
            1,

          historicalSourceCount:
            2,

          evidenceCount:
            2,

          errors:
            [],

          historicalSources:
            [],

          evidence:
            [],
        },
      });

    assert.equal(
      inventory.completeness,
      "INCOMPLETE",
    );

    assert.equal(
      inventory.gapCounts.notYetAcquired,
      1,
    );

    assert.equal(
      inventory.gapCounts.historicallyUnavailable,
      1,
    );

    assert.deepEqual(
      inventory.blockers,
      [
        "conversation-history-historically-unavailable",
        "conversation-history-not-yet-acquired",
      ],
    );
  },
);


test(
  "failed acquisition never becomes acquired history",
  () => {
    const configuration =
      resolveGenesisConversationRuntimeConfiguration(
        {},
      );

    const inventory =
      buildGenesisConversationAcquisitionInventory({
        configuration: {
          ...configuration,

          state:
            "CONFIGURED",

          blocker:
            null,
        },

        latest: {
          state:
            "FAILED",

          attemptedAt:
            100,

          failedAt:
            101,

          error:
            "malformed export",
        },
      });

    assert.equal(
      inventory.historyState,
      "ACQUISITION_FAILED",
    );

    assert.equal(
      inventory.completeness,
      "NOT_ACQUIRED",
    );
  },
);


test(
  "inventory identity is deterministic",
  () => {
    const configuration =
      resolveGenesisConversationRuntimeConfiguration(
        {},
      );

    const first =
      buildGenesisConversationAcquisitionInventory({
        configuration,

        latest:
          null,
      });

    const second =
      buildGenesisConversationAcquisitionInventory({
        configuration,

        latest:
          null,
      });

    assert.equal(
      first.inventoryId,
      second.inventoryId,
    );
  },
);
