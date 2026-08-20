import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationSourceBoundary,
  genesisHistoricalConversationSourceBoundary,
} from "../GenesisConversationSourceBoundary.js";

test(
  "certified repository conversation state is SOURCE ACCESS BLOCKED",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .classification,
      "SOURCE ACCESS BLOCKED",
    );
  },
);

test(
  "conversation compiler is represented as available",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .compiler
        .available,
      true,
    );

    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .compiler
        .compilerName,
      "conversation-compiler",
    );
  },
);

test(
  "governed Knowledge path is represented as available",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .compiler
        .governedKnowledgePathAvailable,
      true,
    );
  },
);

test(
  "conversation acquisition remains unavailable",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .acquisition
        .available,
      false,
    );

    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .acquisition
        .state,
      "blocked",
    );
  },
);

test(
  "source access blocker remains explicit",
  () => {
    assert.match(
      genesisHistoricalConversationSourceBoundary
        .acquisition
        .blocker ??
        "",
      /acquisition\/source adapter/i,
    );
  },
);

test(
  "conversation identity is required by future acquisition contract",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .sourceContract
        .conversationIdentity,
      "required",
    );
  },
);

test(
  "message identity is required by future acquisition contract",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .sourceContract
        .messageIdentity,
      "required",
    );
  },
);

test(
  "speaker role and ordering are required by future acquisition contract",
  () => {
    const contract =
      genesisHistoricalConversationSourceBoundary
        .sourceContract;

    assert.equal(
      contract.speakerRole,
      "required",
    );

    assert.equal(
      contract.ordering,
      "required",
    );
  },
);

test(
  "source reference acquisition event and integrity are required",
  () => {
    const contract =
      genesisHistoricalConversationSourceBoundary
        .sourceContract;

    assert.equal(
      contract.sourceReference,
      "required",
    );

    assert.equal(
      contract.acquisitionEvent,
      "required",
    );

    assert.equal(
      contract.integrityInformation,
      "required",
    );
  },
);

test(
  "repository replay is not blocked by unavailable conversations",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .repositoryReplayBlocked,
      false,
    );
  },
);

test(
  "Git cannot substitute for conversation Evidence",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .conversationEvidenceMayBeSubstitutedByGit,
      false,
    );
  },
);

test(
  "external source marker remains explicit",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .externalSourceMarker,
      "EXTERNAL SOURCE — NOT YET INGESTED",
    );
  },
);

test(
  "external context pending marker remains explicit",
  () => {
    assert.equal(
      genesisHistoricalConversationSourceBoundary
        .externalContextMarker,
      "EXTERNAL CONTEXT PENDING",
    );
  },
);

test(
  "supported and ingestible requires both acquisition and compiler",
  () => {
    const boundary =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          true,

        compilerName:
          "conversation-compiler",

        governedKnowledgePathAvailable:
          true,

        acquisitionAvailable:
          true,

        acquisitionMechanism:
          "governed-import",
      });

    assert.equal(
      boundary.classification,
      "SUPPORTED AND INGESTIBLE",
    );
  },
);

test(
  "available acquisition without complete compiler path is classified separately",
  () => {
    const boundary =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          false,

        governedKnowledgePathAvailable:
          false,

        acquisitionAvailable:
          true,

        acquisitionMechanism:
          "governed-import",
      });

    assert.equal(
      boundary.classification,
      "SUPPORTED BUT REQUIRES COMPILER COMPLETION",
    );
  },
);

test(
  "no acquisition and no compiler path remains architecturally undefined",
  () => {
    const boundary =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          false,

        governedKnowledgePathAvailable:
          false,

        acquisitionAvailable:
          false,
      });

    assert.equal(
      boundary.classification,
      "ARCHITECTURALLY UNDEFINED",
    );
  },
);

test(
  "boundary projection identity is deterministic",
  () => {
    const input = {
      compilerAvailable:
        true,

      compilerName:
        "conversation-compiler",

      governedKnowledgePathAvailable:
        true,

      acquisitionAvailable:
        false,

      acquisitionBlocker:
        "source unavailable",
    };

    assert.equal(
      buildGenesisConversationSourceBoundary(
        input,
      ).projectionId,

      buildGenesisConversationSourceBoundary(
        input,
      ).projectionId,
    );
  },
);

test(
  "acquisition capability change changes boundary identity",
  () => {
    const blocked =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          true,

        compilerName:
          "conversation-compiler",

        governedKnowledgePathAvailable:
          true,

        acquisitionAvailable:
          false,
      });

    const available =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          true,

        compilerName:
          "conversation-compiler",

        governedKnowledgePathAvailable:
          true,

        acquisitionAvailable:
          true,

        acquisitionMechanism:
          "governed-import",
      });

    assert.notEqual(
      blocked.projectionId,
      available.projectionId,
    );
  },
);

test(
  "future governed acquisition changes classification without changing compiler contract",
  () => {
    const blocked =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          true,

        compilerName:
          "conversation-compiler",

        governedKnowledgePathAvailable:
          true,

        acquisitionAvailable:
          false,

        acquisitionBlocker:
          "source unavailable",
      });

    const ingestible =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          true,

        compilerName:
          "conversation-compiler",

        governedKnowledgePathAvailable:
          true,

        acquisitionAvailable:
          true,

        acquisitionMechanism:
          "governed-conversation-import",
      });

    assert.equal(
      blocked.classification,
      "SOURCE ACCESS BLOCKED",
    );

    assert.equal(
      ingestible.classification,
      "SUPPORTED AND INGESTIBLE",
    );

    assert.deepEqual(
      blocked.compiler,
      ingestible.compiler,
    );

    assert.notEqual(
      blocked.projectionId,
      ingestible.projectionId,
    );
  },
);

test(
  "source access blocker does not stop repository-native replay",
  () => {
    const boundary =
      genesisHistoricalConversationSourceBoundary;

    assert.equal(
      boundary.classification,
      "SOURCE ACCESS BLOCKED",
    );

    assert.equal(
      boundary.repositoryReplayBlocked,
      false,
    );

    assert.equal(
      boundary.externalSourceMarker,
      "EXTERNAL SOURCE — NOT YET INGESTED",
    );
  },
);

test(
  "blocked conversation source cannot be satisfied by Git substitution",
  () => {
    const boundary =
      genesisHistoricalConversationSourceBoundary;

    assert.equal(
      boundary
        .conversationEvidenceMayBeSubstitutedByGit,
      false,
    );

    assert.notEqual(
      boundary.classification,
      "SUPPORTED AND INGESTIBLE",
    );
  },
);

test(
  "loss of compiler support changes classification independently from acquisition",
  () => {
    const availableAcquisition =
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          false,

        governedKnowledgePathAvailable:
          false,

        acquisitionAvailable:
          true,

        acquisitionMechanism:
          "governed-conversation-import",
      });

    assert.equal(
      availableAcquisition
        .classification,
      "SUPPORTED BUT REQUIRES COMPILER COMPLETION",
    );
  },
);
