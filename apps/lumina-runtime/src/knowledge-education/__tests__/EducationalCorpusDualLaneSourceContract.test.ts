import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEducationalCorpusSourceContract,
} from "../EducationalCorpusSourceContract.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

import type {
  GenesisHistoricalEducationSourceAssessment,
} from "../GenesisHistoricalEducationSourceAssessment.js";


function artifact():
  EducationalArtifactProjection {
  return {
    id:
      "canonical:test",

    title:
      "Vision 2050",

    kind:
      "canon",

    category:
      "constitutional",

    authorityClass:
      "constitutional",

    approvalState:
      "approved",

    owner:
      "Constitutional Office",

    scope:
      "organization-wide",

    version:
      "1.0.0",

    provenance:
      "docs/canon/VISION_2050.md",

    source:
      "canonical-knowledge",

    sourceRefs: [
      "docs/canon/VISION_2050.md",
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
      "North-star governing curriculum.",

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [],

    relatedCanonicalKnowledge: [
      "canonical:test",
    ],

    relatedMemory:
      [],

    relatedMissions:
      [],

    relatedDecisions:
      [],

    authors:
      [],
  };
}


function dayZero() {
  return {
    state:
      "VALID",

    certification: {
      certificationId:
        "genesis-day-zero-certification:test",
    },

    candidate: {
      candidateId:
        "genesis-day-zero-candidate:test",
    },
  };
}


function historicalAssessment(
  input: {
    recordId:
      `genesis-historical-education:${string}`;

    decision:
      "ELIGIBLE_HISTORICAL_EVIDENCE" |
      "BLOCKED";
  },
):
  GenesisHistoricalEducationSourceAssessment {
  return {
    policyVersion:
      "genesis-historical-education-source-assessment:v1",

    recordId:
      input.recordId,

    replayId:
      "genesis-replay:test",

    episodeId:
      "genesis-episode:test",

    decision:
      input.decision,

    learningRole:
      input.decision ===
        "ELIGIBLE_HISTORICAL_EVIDENCE"
        ? "HISTORICAL_CONTEXT"
        : null,

    provenance: {
      sourceReferenceIds: [
        "genesis-source-ref:test",
      ],

      sourceRevisionIds: [
        "genesis-source-revision:test",
      ],

      eventIds: [
        "genesis-event:test",
      ],
    },

    temporalAuthority: {
      historicalStatus:
        "historically-observed",

      currentStatus:
        "not-applicable",
    },

    governingAuthority:
      false,

    reasons:
      input.decision ===
        "ELIGIBLE_HISTORICAL_EVIDENCE"
        ? [
            "certified-genesis-historical-provenance-present",
            "historical-evidence-does-not-create-current-authority",
          ]
        : [
            "genesis-historical-education-source-provenance-missing",
          ],
  };
}


test(
  "source contract carries canonical and historical lanes separately",
  () => {
    const contract =
      buildEducationalCorpusSourceContract({
        artifacts: [
          artifact(),
        ],

        historicalAssessments: [
          historicalAssessment({
            recordId:
              "genesis-historical-education:eligible",

            decision:
              "ELIGIBLE_HISTORICAL_EVIDENCE",
          }),
        ],

        dayZero:
          dayZero() as never,
      });

    assert.equal(
      contract.assessments.length,
      1,
    );

    assert.equal(
      contract.historicalAssessments.length,
      1,
    );

    assert.equal(
      contract.summary.eligible,
      1,
    );

    assert.equal(
      contract.summary.historicalEligible,
      1,
    );

    assert.equal(
      contract.summary.historicalBlocked,
      0,
    );

    assert.equal(
      contract.historicalAssessments[0]
        ?.governingAuthority,
      false,
    );
  },
);


test(
  "blocked historical records remain separate from canonical unresolved artifacts",
  () => {
    const contract =
      buildEducationalCorpusSourceContract({
        artifacts: [
          artifact(),
        ],

        historicalAssessments: [
          historicalAssessment({
            recordId:
              "genesis-historical-education:blocked",

            decision:
              "BLOCKED",
          }),
        ],

        dayZero:
          dayZero() as never,
      });

    assert.deepEqual(
      contract.unresolvedArtifactIds,
      [],
    );

    assert.deepEqual(
      contract.blockedHistoricalRecordIds,
      [
        "genesis-historical-education:blocked",
      ],
    );

    assert.equal(
      contract.summary.historicalBlocked,
      1,
    );
  },
);


test(
  "historical assessments participate in contract identity when supplied",
  () => {
    const base = {
      artifacts: [
        artifact(),
      ],

      dayZero:
        dayZero() as never,
    };

    const first =
      buildEducationalCorpusSourceContract({
        ...base,

        historicalAssessments: [
          historicalAssessment({
            recordId:
              "genesis-historical-education:first",

            decision:
              "ELIGIBLE_HISTORICAL_EVIDENCE",
          }),
        ],
      });

    const second =
      buildEducationalCorpusSourceContract({
        ...base,

        historicalAssessments: [
          historicalAssessment({
            recordId:
              "genesis-historical-education:second",

            decision:
              "ELIGIBLE_HISTORICAL_EVIDENCE",
          }),
        ],
      });

    assert.notEqual(
      first.contractId,
      second.contractId,
    );
  },
);


test(
  "existing caller without historical lane remains valid",
  () => {
    const contract =
      buildEducationalCorpusSourceContract({
        artifacts: [
          artifact(),
        ],

        dayZero:
          dayZero() as never,
      });

    assert.equal(
      contract.historicalAssessments.length,
      0,
    );

    assert.equal(
      contract.summary.historicalArtifacts,
      0,
    );

    assert.deepEqual(
      contract.blockedHistoricalRecordIds,
      [],
    );
  },
);
