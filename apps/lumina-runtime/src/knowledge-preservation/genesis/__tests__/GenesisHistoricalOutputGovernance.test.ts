import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisHistoricalOutputGovernanceProjection,
} from "../GenesisHistoricalOutputGovernance.js";

import type {
  GenesisHistoricalAdmissionGovernanceProjection,
} from "../GenesisHistoricalAdmissionGovernanceProjection.js";

import type {
  GenesisKnowledgeLifecycleProjection,
} from "../GenesisKnowledgeLifecycleCorrelation.js";


const governance:
  GenesisHistoricalAdmissionGovernanceProjection = {
    projectionId:
      "genesis-historical-admission-governance:fixture",

    records: [
      {
        historicalSourceId:
          "genesis-source:adr:historical",

        evidenceId:
          "genesis-evidence:adr:historical",

        classification:
          "requires-governance-review",

        correlationEligible:
          false,

        knowledgeManufacturingAuthorized:
          false,

        reasons: [
          "Knowledge manufacturing requires an explicit authority owner.",
          "Knowledge manufacturing requires an explicit authority scope.",
          "Knowledge manufacturing requires an explicit authority version.",
        ],
      },

      {
        historicalSourceId:
          "genesis-source:adr:current",

        evidenceId:
          "genesis-evidence:adr:current",

        classification:
          "knowledge-seeding-eligible",

        correlationEligible:
          true,

        knowledgeManufacturingAuthorized:
          true,

        reasons: [
          "Current policy authorizes manufacturing.",
        ],
      },
    ],

    summary: {
      admittedEvidence:
        2,

      historicalEvidenceOnly:
        0,

      historicalCorrelationEligible:
        0,

      knowledgeSeedingEligible:
        1,

      requiresGovernanceReview:
        1,

      knowledgeManufacturingAuthorized:
        1,
    },
  };


const lifecycle:
  GenesisKnowledgeLifecycleProjection = {
    projectionId:
      "genesis-knowledge-lifecycle:fixture",

    corpusProjectionId:
      "genesis-corpus-projection:fixture",

    records: [
      {
        evidenceId:
          "genesis-evidence:adr:historical",

        manufacturingCorrelation:
          "correlated",

        manufacturingRunId:
          "knowledge-manufacturing-run:historical",

        matchingManufacturingRunIds: [
          "knowledge-manufacturing-run:historical",
        ],

        manufacturingStatus:
          "completed",

        currentStage:
          "Canonical Knowledge",

        knowledgeIR: {
          state:
            "completed",

          events:
            [],
        },

        validation: {
          state:
            "completed",

          events:
            [],
        },

        packageAssembly: {
          state:
            "completed",

          events:
            [],
        },

        canonicalReview: {
          state:
            "approved",

          events:
            [],
        },

        canonicalKnowledge: {
          state:
            "published",

          events:
            [],
        },

        packageId:
          "KP-2026-000027",

        canonicalKnowledgeIds: [
          "canonical:adr:historical",
        ],

        organizationalMemory: [
          {
            status:
              "correlated",

            memoryRecordIds: [
              "canonical-memory:historical",
            ],

            adaptationValidated:
              true,
          },
        ],

        educationalEligibility: {
          status:
            "not-evaluated",

          eligible:
            null,
        },
      },

      {
        evidenceId:
          "genesis-evidence:adr:current",

        manufacturingCorrelation:
          "correlated",

        manufacturingRunId:
          "knowledge-manufacturing-run:current",

        matchingManufacturingRunIds: [
          "knowledge-manufacturing-run:current",
        ],

        manufacturingStatus:
          "completed",

        currentStage:
          "Knowledge Package Assembly",

        knowledgeIR: {
          state:
            "completed",

          events:
            [],
        },

        validation: {
          state:
            "completed",

          events:
            [],
        },

        packageAssembly: {
          state:
            "completed",

          events:
            [],
        },

        canonicalReview: {
          state:
            "not-reached",

          events:
            [],
        },

        canonicalKnowledge: {
          state:
            "not-reached",

          events:
            [],
        },

        packageId:
          "KP-2026-000999",

        canonicalKnowledgeIds:
          [],

        organizationalMemory:
          [],

        educationalEligibility: {
          status:
            "not-evaluated",

          eligible:
            null,
        },
      },
    ],

    summary: {
      admittedEvidence:
        2,

      manufacturingCorrelated:
        2,

      manufacturingAmbiguous:
        0,

      manufacturingUncorrelated:
        0,

      knowledgeIRReached:
        2,

      validated:
        2,

      packaged:
        2,

      awaitingCanonicalReview:
        0,

      canonical:
        1,

      memoryCorrelatedCanonicalItems:
        1,

      memoryAdaptationValidated:
        1,

      educationalEligibilityEvaluated:
        0,
    },
  };


test(
  "historical output remains preserved while current policy authorization is withdrawn",
  () => {
    const projection =
      buildGenesisHistoricalOutputGovernanceProjection({
        historicalAdmissionGovernance:
          governance,

        knowledgeLifecycle:
          lifecycle,
      });

    const historical =
      projection.records.find(
        record =>
          record.evidenceId ===
          "genesis-evidence:adr:historical",
      );

    assert.ok(
      historical,
    );

    assert.equal(
      historical.currentPolicyStatus,
      "historical-output-not-currently-authorized",
    );

    assert.equal(
      historical.currentClassification,
      "requires-governance-review",
    );

    assert.equal(
      historical.currentKnowledgeManufacturingAuthorized,
      false,
    );

    assert.equal(
      historical.historicalOutputPreserved,
      true,
    );

    assert.equal(
      historical.packageId,
      "KP-2026-000027",
    );

    assert.deepEqual(
      historical.canonicalKnowledgeIds,
      [
        "canonical:adr:historical",
      ],
    );

    assert.deepEqual(
      historical.organizationalMemoryRecordIds,
      [
        "canonical-memory:historical",
      ],
    );
  },
);


test(
  "currently authorized historical output remains explicitly authorized",
  () => {
    const projection =
      buildGenesisHistoricalOutputGovernanceProjection({
        historicalAdmissionGovernance:
          governance,

        knowledgeLifecycle:
          lifecycle,
      });

    const current =
      projection.records.find(
        record =>
          record.evidenceId ===
          "genesis-evidence:adr:current",
      );

    assert.ok(
      current,
    );

    assert.equal(
      current.currentPolicyStatus,
      "current-policy-authorized",
    );

    assert.equal(
      current.historicalOutputPreserved,
      true,
    );
  },
);


test(
  "summary reconciles historical outputs and current policy status",
  () => {
    const projection =
      buildGenesisHistoricalOutputGovernanceProjection({
        historicalAdmissionGovernance:
          governance,

        knowledgeLifecycle:
          lifecycle,
      });

    assert.deepEqual(
      projection.summary,
      {
        historicalOutputs:
          2,

        currentPolicyAuthorized:
          1,

        historicalOutputsNotCurrentlyAuthorized:
          1,

        currentGovernanceUnavailable:
          0,

        packagedHistoricalOutputs:
          2,

        canonicalHistoricalOutputs:
          1,

        memoryCorrelatedHistoricalOutputs:
          1,
      },
    );
  },
);


test(
  "projection is deterministic and does not mutate lifecycle state",
  () => {
    const before =
      JSON.stringify(
        lifecycle,
      );

    const first =
      buildGenesisHistoricalOutputGovernanceProjection({
        historicalAdmissionGovernance:
          governance,

        knowledgeLifecycle:
          lifecycle,
      });

    const second =
      buildGenesisHistoricalOutputGovernanceProjection({
        historicalAdmissionGovernance:
          governance,

        knowledgeLifecycle:
          lifecycle,
      });

    assert.equal(
      first.projectionId,
      second.projectionId,
    );

    assert.equal(
      JSON.stringify(
        lifecycle,
      ),
      before,
    );
  },
);
