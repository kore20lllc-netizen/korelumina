import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisKnowledgeLifecycleProjection,
  GenesisKnowledgeLifecycleRecord,
} from "../GenesisKnowledgeLifecycleCorrelation.js";

import type {
  GenesisRepositorySeedCertification,
} from "../GenesisRepositorySeedCertification.js";

import {
  buildGenesisRepositorySeedHandoffCertification,
} from "../GenesisRepositorySeedHandoffCertification.js";


function lifecycleRecord(
  evidenceId:
    string,

  overrides:
    Partial<GenesisKnowledgeLifecycleRecord> =
      {},
): GenesisKnowledgeLifecycleRecord {
  return {
    evidenceId,

    manufacturingCorrelation:
      "correlated",

    manufacturingRunId:
      `KMR-${evidenceId}`,

    matchingManufacturingRunIds: [
      `KMR-${evidenceId}`,
    ],

    manufacturingStatus:
      "active",

    currentStage:
      "Knowledge IR",

    knowledgeIR: {
      state:
        "entered",
      events:
        [],
    },

    validation: {
      state:
        "not-reached",
      events:
        [],
    },

    packageAssembly: {
      state:
        "not-reached",
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
      null,

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

    ...overrides,
  };
}


function lifecycle(
  records:
    readonly GenesisKnowledgeLifecycleRecord[],
): GenesisKnowledgeLifecycleProjection {
  return {
    projectionId:
      "genesis-knowledge-lifecycle:test",

    corpusProjectionId:
      "genesis-corpus-projection:test",

    records,

    summary: {
      admittedEvidence:
        records.length,

      manufacturingCorrelated:
        records.filter(
          record =>
            record.manufacturingCorrelation ===
            "correlated",
        ).length,

      manufacturingAmbiguous:
        records.filter(
          record =>
            record.manufacturingCorrelation ===
            "ambiguous",
        ).length,

      manufacturingUncorrelated:
        records.filter(
          record =>
            record.manufacturingCorrelation ===
            "not-correlated",
        ).length,

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
  };
}


function seedCertification(
  overrides:
    Partial<GenesisRepositorySeedCertification> =
      {},
): GenesisRepositorySeedCertification {
  return {
    certificationId:
      "genesis-repository-seed-certification:test",

    repositorySeedCorpus:
      "CERTIFIED",

    replay: {
      exact:
        true,

      replayCount:
        1,

      totalSources:
        3,

      completedSources:
        3,

      admittedSources:
        3,

      skippedSources:
        0,

      blockedSources:
        0,
    },

    partition: {
      knowledgeSeedingEligible:
        [],

      historicalCorrelationEligible:
        [],

      historicalEvidenceOnly:
        [],

      requiresGovernanceReview:
        [],
    },

    seedEvidenceIds: [
      "evidence:seed",
    ],

    externalConversationCoverage:
      "NOT_ACQUIRED",

    broaderEducationalCompleteness:
      "NOT_CERTIFIED",

    blockers:
      [],

    ...overrides,
  };
}


test(
  "certified seed Evidence with exactly one manufacturing correlation certifies handoff",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
            ),
          ]),
      });

    assert.equal(
      result.state,
      "CERTIFIED",
    );

    assert.equal(
      result.summary.handedOff,
      1,
    );

    assert.equal(
      result.records[0]
        .manufacturingRunId,
      "KMR-evidence:seed",
    );

    assert.deepEqual(
      result.blockers,
      [],
    );
  },
);


test(
  "uncorrelated seed Evidence remains incomplete",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
              {
                manufacturingCorrelation:
                  "not-correlated",

                manufacturingRunId:
                  null,

                matchingManufacturingRunIds:
                  [],

                manufacturingStatus:
                  null,

                currentStage:
                  null,
              },
            ),
          ]),
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.equal(
      result.summary.notCorrelated,
      1,
    );
  },
);


test(
  "ambiguous manufacturing correlation blocks handoff",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
              {
                manufacturingCorrelation:
                  "ambiguous",

                manufacturingRunId:
                  null,

                matchingManufacturingRunIds: [
                  "KMR-a",
                  "KMR-b",
                ],
              },
            ),
          ]),
      });

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.equal(
      result.summary.ambiguous,
      1,
    );
  },
);


test(
  "missing lifecycle record fails closed as incomplete",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([]),
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.equal(
      result.summary.missing,
      1,
    );
  },
);


test(
  "uncertified repository seed corpus cannot certify handoff",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification({
            repositorySeedCorpus:
              "INCOMPLETE",
          }),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
            ),
          ]),
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.ok(
      result.blockers.includes(
        "repository-seed-corpus-not-certified",
      ),
    );
  },
);


test(
  "blocked repository seed corpus remains blocked",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification({
            repositorySeedCorpus:
              "BLOCKED",
          }),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
            ),
          ]),
      });

    assert.equal(
      result.state,
      "BLOCKED",
    );
  },
);


test(
  "non-seed admitted Evidence does not require manufacturing correlation",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
            ),

            lifecycleRecord(
              "evidence:historical",
              {
                manufacturingCorrelation:
                  "not-correlated",

                manufacturingRunId:
                  null,

                matchingManufacturingRunIds:
                  [],

                manufacturingStatus:
                  null,

                currentStage:
                  null,
              },
            ),
          ]),
      });

    assert.equal(
      result.state,
      "CERTIFIED",
    );

    assert.equal(
      result.records.length,
      1,
    );
  },
);


test(
  "downstream manufacturing failure does not revoke completed handoff",
  () => {
    const result =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
              {
                manufacturingStatus:
                  "failed",

                currentStage:
                  "Validation",
              },
            ),
          ]),
      });

    assert.equal(
      result.state,
      "CERTIFIED",
    );

    assert.equal(
      result.records[0]
        .manufacturingStatus,
      "failed",
    );

    assert.equal(
      result.records[0]
        .currentStage,
      "Validation",
    );
  },
);


test(
  "Organizational Memory and education do not determine handoff certification",
  () => {
    const first =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([
            lifecycleRecord(
              "evidence:seed",
            ),
          ]),
      });

    const changedRecord =
      lifecycleRecord(
        "evidence:seed",
      );

    changedRecord.organizationalMemory = [
      {
        status:
          "ambiguous",

        memoryRecordIds: [
          "memory:a",
          "memory:b",
        ],

        adaptationValidated:
          false,
      },
    ];

    const second =
      buildGenesisRepositorySeedHandoffCertification({
        repositorySeedCertification:
          seedCertification(),

        knowledgeLifecycle:
          lifecycle([
            changedRecord,
          ]),
      });

    assert.equal(
      second.state,
      "CERTIFIED",
    );

    assert.equal(
      second.certificationId,
      first.certificationId,
    );
  },
);


test(
  "certification identity is deterministic",
  () => {
    const input = {
      repositorySeedCertification:
        seedCertification(),

      knowledgeLifecycle:
        lifecycle([
          lifecycleRecord(
            "evidence:seed",
          ),
        ]),
    };

    assert.equal(
      buildGenesisRepositorySeedHandoffCertification(
        input,
      ).certificationId,

      buildGenesisRepositorySeedHandoffCertification(
        input,
      ).certificationId,
    );
  },
);
