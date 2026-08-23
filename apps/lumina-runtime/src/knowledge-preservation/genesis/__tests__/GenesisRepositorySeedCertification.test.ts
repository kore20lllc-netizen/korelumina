import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisCorpusReadModel,
} from "../GenesisCorpusReadModel.js";

import type {
  GenesisHistoricalAdmissionGovernanceProjection,
} from "../GenesisHistoricalAdmissionGovernanceProjection.js";

import {
  buildGenesisConversationSourceBoundary,
} from "../GenesisConversationSourceBoundary.js";

import {
  buildGenesisRepositorySeedCertification,
} from "../GenesisRepositorySeedCertification.js";


function corpus():
  GenesisCorpusReadModel {
  return {
    projectionId:
      "genesis-corpus-projection:test",

    sourceSummary: {
      uniqueSources: 3,
      sourceRevisions: 3,
      byClass: {
        commit: 3,
      },
    },

    evolutionSummary: {
      historicalEvents: 3,
      relationships: 0,
      evolutionEpisodes: 0,
      conflictedEpisodes: 0,
      incompleteEpisodes: 0,
      validatedEpisodes: 0,
      unresolvedRelationships: 0,
    },

    knowledgeLifecycle: {
      admittedEvidence: 3,
      manufacturingLinkedEvidence: 0,
      ambiguousManufacturingLinks: 0,
      packages: 0,
      canonicalKnowledge: 0,

      organizationalMemory: {
        status: "not-correlated",
        adaptedRecords: null,
      },

      educationalEligibility: {
        status: "not-correlated",
        eligibleRecords: null,
      },
    },

    externalContext: {
      pendingEpisodes: 2,
      notYetIngestedConversationSources: 5,
      externalSourceReferences: 5,
      complete: false,
    },

    replays: [
      {
        replayId:
          `genesis-replay:${"a".repeat(64)}`,

        found: true,
        manifestId:
          "genesis-manifest:test",
        manifestReadiness:
          "READY",
        executionStatus:
          "completed",
        replayCorpusStatus:
          "COMPLETE",
        totalManifestSources: 3,

        progress: {
          totalSources: 3,
          completedSources: 3,
          admittedSources: 3,
          skippedSources: 0,
          blockedSources: 0,
        },

        admittedEvidenceIds: [
          "evidence:seed",
          "evidence:correlation",
          "evidence:history",
        ],

        manufacturingRunIds: [],
        packageIds: [],
        canonicalKnowledgeIds: [],
        ambiguousManufacturingLinks: 0,
        allAdmittedEvidenceLinked: false,
      },
    ],

    sources: [],
    events: [],
    relationships: [],
    episodes: [],
  };
}


function governance():
  GenesisHistoricalAdmissionGovernanceProjection {
  return {
    projectionId:
      "genesis-historical-admission-governance:test",

    records: [
      {
        historicalSourceId:
          "source:seed",
        evidenceId:
          "evidence:seed",
        classification:
          "knowledge-seeding-eligible",
        correlationEligible: true,
        knowledgeManufacturingAuthorized: true,
        reasons: [],
      },
      {
        historicalSourceId:
          "source:correlation",
        evidenceId:
          "evidence:correlation",
        classification:
          "historical-correlation-eligible",
        correlationEligible: true,
        knowledgeManufacturingAuthorized: false,
        reasons: [],
      },
      {
        historicalSourceId:
          "source:history",
        evidenceId:
          "evidence:history",
        classification:
          "historical-evidence-only",
        correlationEligible: false,
        knowledgeManufacturingAuthorized: false,
        reasons: [],
      },
    ],

    summary: {
      admittedEvidence: 3,
      historicalEvidenceOnly: 1,
      historicalCorrelationEligible: 1,
      knowledgeSeedingEligible: 1,
      requiresGovernanceReview: 0,
      knowledgeManufacturingAuthorized: 1,
    },
  };
}


function conversationUnavailable() {
  return buildGenesisConversationSourceBoundary({
    compilerAvailable: true,
    compilerName:
      "conversation-compiler",
    governedKnowledgePathAvailable: true,
    acquisitionAvailable: false,
    acquisitionBlocker:
      "external acquisition not implemented",
  });
}


test(
  "complete repository replay certifies exact governed seed partition",
  () => {
    const result =
      buildGenesisRepositorySeedCertification({
        corpus: corpus(),
        historicalAdmissionGovernance:
          governance(),
        conversationSource:
          conversationUnavailable(),
      });

    assert.equal(
      result.repositorySeedCorpus,
      "CERTIFIED",
    );

    assert.deepEqual(
      result.seedEvidenceIds,
      ["evidence:seed"],
    );

    assert.equal(
      result.replay.exact,
      true,
    );

    assert.equal(
      result.replay.totalSources,
      3,
    );

    assert.equal(
      result.replay.completedSources,
      3,
    );

    assert.equal(
      result.replay.blockedSources,
      0,
    );

    assert.deepEqual(
      result.blockers,
      [],
    );
  },
);


test(
  "conversation remains first-class while unavailable acquisition does not block repository seeding",
  () => {
    const result =
      buildGenesisRepositorySeedCertification({
        corpus: corpus(),
        historicalAdmissionGovernance:
          governance(),
        conversationSource:
          conversationUnavailable(),
      });

    assert.equal(
      result.repositorySeedCorpus,
      "CERTIFIED",
    );

    assert.equal(
      result.externalConversationCoverage,
      "NOT_ACQUIRED",
    );

    assert.equal(
      result.broaderEducationalCompleteness,
      "NOT_CERTIFIED",
    );
  },
);


test(
  "historical correlation and evidence-only records remain outside seed set",
  () => {
    const result =
      buildGenesisRepositorySeedCertification({
        corpus: corpus(),
        historicalAdmissionGovernance:
          governance(),
        conversationSource:
          conversationUnavailable(),
      });

    assert.deepEqual(
      result.seedEvidenceIds,
      ["evidence:seed"],
    );

    assert.deepEqual(
      result.partition
        .historicalCorrelationEligible
        .map(record => record.evidenceId),
      ["evidence:correlation"],
    );

    assert.deepEqual(
      result.partition
        .historicalEvidenceOnly
        .map(record => record.evidenceId),
      ["evidence:history"],
    );
  },
);


test(
  "governance review blocks automatic repository seed certification",
  () => {
    const c = corpus();
    const g = governance();

    c.replays = [
      {
      ...c.replays[0],
      totalManifestSources: 4,
      progress: {
        totalSources: 4,
        completedSources: 4,
        admittedSources: 4,
        skippedSources: 0,
        blockedSources: 0,
      },
      admittedEvidenceIds: [
        ...c.replays[0].admittedEvidenceIds,
        "evidence:review",
      ],
    },
    ];

    g.records = [
      ...g.records,
      {
        historicalSourceId:
          "source:review",
        evidenceId:
          "evidence:review",
        classification:
          "requires-governance-review",
        correlationEligible: false,
        knowledgeManufacturingAuthorized: false,
        reasons: [
          "governance unresolved",
        ],
      },
    ];

    g.summary = {
      ...g.summary,
      admittedEvidence: 4,
      requiresGovernanceReview: 1,
    };

    const result =
      buildGenesisRepositorySeedCertification({
        corpus: c,
        historicalAdmissionGovernance: g,
        conversationSource:
          conversationUnavailable(),
      });

    assert.equal(
      result.repositorySeedCorpus,
      "BLOCKED",
    );

    assert.ok(
      result.blockers.includes(
        "governance-review-required",
      ),
    );
  },
);


test(
  "partial replay cannot masquerade as certified",
  () => {
    const c = corpus();
    const g = governance();

    c.replays = [
      {
      ...c.replays[0],
      executionStatus: "running",
      replayCorpusStatus: "PARTIAL",
      progress: {
        totalSources: 3,
        completedSources: 2,
        admittedSources: 2,
        skippedSources: 0,
        blockedSources: 0,
      },
      admittedEvidenceIds: [
        "evidence:seed",
        "evidence:correlation",
      ],
    },
    ];

    g.records =
      g.records.filter(
        record =>
          record.evidenceId !==
          "evidence:history",
      );

    g.summary = {
      ...g.summary,
      admittedEvidence: 2,
      historicalEvidenceOnly: 0,
    };

    assert.equal(
      buildGenesisRepositorySeedCertification({
        corpus: c,
        historicalAdmissionGovernance: g,
        conversationSource:
          conversationUnavailable(),
      }).repositorySeedCorpus,
      "INCOMPLETE",
    );
  },
);


test(
  "blocked replay remains blocked",
  () => {
    const c = corpus();
    const g = governance();

    c.replays = [
      {
      ...c.replays[0],
      executionStatus: "blocked",
      replayCorpusStatus: "BLOCKED",
      progress: {
        totalSources: 3,
        completedSources: 3,
        admittedSources: 2,
        skippedSources: 0,
        blockedSources: 1,
      },
      admittedEvidenceIds: [
        "evidence:seed",
        "evidence:correlation",
      ],
    },
    ];

    g.records =
      g.records.filter(
        record =>
          record.evidenceId !==
          "evidence:history",
      );

    g.summary = {
      ...g.summary,
      admittedEvidence: 2,
      historicalEvidenceOnly: 0,
    };

    const result =
      buildGenesisRepositorySeedCertification({
        corpus: c,
        historicalAdmissionGovernance: g,
        conversationSource:
          conversationUnavailable(),
      });

    assert.equal(
      result.repositorySeedCorpus,
      "BLOCKED",
    );

    assert.equal(
      result.replay.blockedSources,
      1,
    );
  },
);


test(
  "admitted evidence missing from governance partition fails closed",
  () => {
    const g = governance();

    g.records =
      g.records.filter(
        record =>
          record.evidenceId !==
          "evidence:history",
      );

    g.summary = {
      ...g.summary,
      admittedEvidence: 2,
      historicalEvidenceOnly: 0,
    };

    const result =
      buildGenesisRepositorySeedCertification({
        corpus: corpus(),
        historicalAdmissionGovernance: g,
        conversationSource:
          conversationUnavailable(),
      });

    assert.equal(
      result.repositorySeedCorpus,
      "INCOMPLETE",
    );

    assert.ok(
      result.blockers.includes(
        "admitted-evidence-governance-partition-mismatch",
      ),
    );
  },
);


test(
  "downstream package canonical memory and education state do not affect certification",
  () => {
    const first =
      buildGenesisRepositorySeedCertification({
        corpus: corpus(),
        historicalAdmissionGovernance:
          governance(),
        conversationSource:
          conversationUnavailable(),
      });

    const changed = corpus();

    changed.knowledgeLifecycle = {
      admittedEvidence: 999,
      manufacturingLinkedEvidence: 999,
      ambiguousManufacturingLinks: 999,
      packages: 999,
      canonicalKnowledge: 999,

      organizationalMemory: {
        status: "not-correlated",
        adaptedRecords: null,
      },

      educationalEligibility: {
        status: "not-correlated",
        eligibleRecords: null,
      },
    };

    const second =
      buildGenesisRepositorySeedCertification({
        corpus: changed,
        historicalAdmissionGovernance:
          governance(),
        conversationSource:
          conversationUnavailable(),
      });

    assert.equal(
      second.certificationId,
      first.certificationId,
    );

    assert.equal(
      second.repositorySeedCorpus,
      "CERTIFIED",
    );
  },
);


test(
  "certification identity is deterministic",
  () => {
    const first =
      buildGenesisRepositorySeedCertification({
        corpus: corpus(),
        historicalAdmissionGovernance:
          governance(),
        conversationSource:
          conversationUnavailable(),
      });

    const second =
      buildGenesisRepositorySeedCertification({
        corpus: corpus(),
        historicalAdmissionGovernance:
          governance(),
        conversationSource:
          conversationUnavailable(),
      });

    assert.equal(
      first.certificationId,
      second.certificationId,
    );
  },
);
