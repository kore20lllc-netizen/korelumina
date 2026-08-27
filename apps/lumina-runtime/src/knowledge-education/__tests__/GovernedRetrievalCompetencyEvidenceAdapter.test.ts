import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveGovernedRetrievalCompetencyEvidence,
} from "../GovernedRetrievalCompetencyEvidenceAdapter.js";


test(
  "governed canonical retrieval produces pending competency evidence with preserved authority and provenance",
  () => {
    const assessments =
      deriveGovernedRetrievalCompetencyEvidence({
        generatedAt:
          100,

        request: {
          objective:
            "Retrieve platform constitution",
        },

        knowledge: [
          {
            id:
              "canonical:platform-constitution",

            type:
              "CandidateArtifact",

            title:
              "Platform Constitution",

            summary:
              "Platform constitutional authority.",

            confidence:
              1,

            evidenceRefs: [
              "evidence:platform-constitution",
            ],

            relationships:
              {},

            createdAt:
              1,

            updatedAt:
              2,

            status:
              "canonical",

            metadata: {
              governance: {
                authority:
                  "architecture",

                owner:
                  "Constitutional Office",

                scope:
                  "Platform",

                approvalState:
                  "approved",

                reviewDecision:
                  "approved",

                sourceEvidenceRefs: [
                  "evidence:platform-constitution",
                ],

                provenance: {
                  evidenceIds: [
                    "evidence:platform-constitution",
                  ],

                  sourceLocations: [
                    "docs/architecture/00_PLATFORM_CONSTITUTION.md",
                  ],

                  contentRefs: [
                    "sha256:platform-constitution",
                  ],

                  sources: [
                    "genesis-historical-replay",
                  ],
                },
              },
            },
          },
        ],
      } as never);

    assert.equal(
      assessments.length,
      1,
    );

    assert.equal(
      assessments[0].eligible,
      true,
    );

    assert.deepEqual(
      assessments[0].missingRequirements,
      [],
    );

    assert.equal(
      assessments[0].evidence?.competencyId,
      "governed-retrieval",
    );

    assert.equal(
      assessments[0].evidence?.source,
      "canonical-knowledge",
    );

    assert.equal(
      assessments[0].evidence?.sourceRef,
      "canonical:platform-constitution",
    );

    assert.equal(
      assessments[0].evidence?.validationState,
      "PENDING",
    );

    assert.equal(
      assessments[0].evidence?.validatedBy,
      null,
    );
  },
);


test(
  "retrieval without governed provenance cannot produce competency evidence",
  () => {
    const assessments =
      deriveGovernedRetrievalCompetencyEvidence({
        generatedAt:
          100,

        request: {
          objective:
            "Retrieve ungoverned knowledge",
        },

        knowledge: [
          {
            id:
              "canonical:incomplete",

            type:
              "CandidateArtifact",

            title:
              "Incomplete",

            summary:
              "Missing governance.",

            confidence:
              1,

            evidenceRefs:
              [],

            relationships:
              {},

            createdAt:
              1,

            updatedAt:
              2,

            status:
              "canonical",

            metadata:
              {},
          },
        ],
      } as never);

    assert.equal(
      assessments[0].eligible,
      false,
    );

    assert.equal(
      assessments[0].evidence,
      null,
    );

    assert.ok(
      assessments[0]
        .missingRequirements
        .includes(
          "provenance",
        ),
    );

    assert.ok(
      assessments[0]
        .missingRequirements
        .includes(
          "approved-state",
        ),
    );
  },
);


test(
  "superseded knowledge cannot manufacture governed retrieval competency evidence",
  () => {
    const assessments =
      deriveGovernedRetrievalCompetencyEvidence({
        generatedAt:
          100,

        request: {
          objective:
            "Retrieve historical knowledge",
        },

        knowledge: [
          {
            id:
              "canonical:superseded",

            type:
              "CandidateArtifact",

            title:
              "Superseded",

            summary:
              "Historical knowledge.",

            confidence:
              1,

            evidenceRefs: [
              "evidence:historical",
            ],

            relationships:
              {},

            createdAt:
              1,

            updatedAt:
              2,

            status:
              "superseded",

            metadata: {
              governance: {
                authority:
                  "Architecture Council",

                owner:
                  "Knowledge Operations",

                scope:
                  "Platform",

                approvalState:
                  "approved",

                reviewDecision:
                  "approved",

                provenance: {
                  evidenceIds: [
                    "evidence:historical",
                  ],

                  sourceLocations: [
                    "docs/history.md",
                  ],

                  contentRefs: [
                    "sha256:historical",
                  ],
                },
              },
            },
          },
        ],
      } as never);

    assert.equal(
      assessments[0].eligible,
      false,
    );

    assert.equal(
      assessments[0].evidence,
      null,
    );

    assert.ok(
      assessments[0]
        .missingRequirements
        .includes(
          "canonical-status",
        ),
    );
  },
);
