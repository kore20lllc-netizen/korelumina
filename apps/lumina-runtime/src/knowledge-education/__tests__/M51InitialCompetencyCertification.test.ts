import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyInitialCompetency,
  validateInitialCompetencyCertification,
} from "../InitialCompetencyCertification.js";

import type {
  InitialCompetencyAssessmentCandidate,
} from "../InitialCompetencyAssessmentCandidate.js";


function readyCandidate():
  InitialCompetencyAssessmentCandidate {
  return {
    candidateId:
      "initial-competency-assessment:test",

    assessmentVersion:
      "initial-competency-assessment:v1",

    state:
      "READY_FOR_HUMAN_REVIEW",

    educationalCorpusCertificationId:
      "educational-corpus-certification:test",

    competencies: [
      {
        id:
          "authority-interpretation",

        title:
          "Authority interpretation",

        status:
          "completed",

        evidence:
          "validated",

        resolved:
          true,
      },

      {
        id:
          "governed-retrieval",

        title:
          "Governed retrieval",

        status:
          "completed",

        evidence:
          "validated",

        resolved:
          true,
      },
    ],

    completedCompetencyIds: [
      "authority-interpretation",
      "governed-retrieval",
    ],

    unresolvedCompetencyIds:
      [],

    blockers:
      [],

    humanReview: {
      required:
        true,

      available:
        true,
    },

    downstream: {
      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}


test(
  "M51.5j12 certifies only a ready Initial Competency candidate",
  () => {
    const candidate =
      readyCandidate();

    const certification =
      certifyInitialCompetency({
        candidate,

        decision: {
          certifiedBy:
            "human-review:test",

          certifiedAt:
            100,

          reason:
            "All competency domains were reviewed and accepted.",
        },
      });

    assert.equal(
      certification.state,
      "CERTIFIED",
    );

    assert.equal(
      certification.candidateId,
      candidate.candidateId,
    );

    assert.equal(
      certification.educationalCorpusCertificationId,
      candidate.educationalCorpusCertificationId,
    );

    assert.equal(
      certification.downstream
        .initialCompetencyCertified,
      true,
    );

    assert.equal(
      certification.downstream
        .chiefAgentActivationAuthorized,
      false,
    );

    const validation =
      validateInitialCompetencyCertification({
        certification,

        currentCandidate:
          candidate,
      });

    assert.equal(
      validation.state,
      "VALID",
    );

    assert.deepEqual(
      validation.blockers,
      [],
    );
  },
);


test(
  "M51.5j12 rejects certification when competency evidence is incomplete",
  () => {
    const candidate =
      readyCandidate();

    candidate.state =
      "INCOMPLETE";

    candidate.unresolvedCompetencyIds = [
      "governed-retrieval",
    ];

    candidate.completedCompetencyIds = [
      "authority-interpretation",
    ];

    candidate.humanReview = {
      required:
        true,

      available:
        false,
    };

    assert.throws(
      () =>
        certifyInitialCompetency({
          candidate,

          decision: {
            certifiedBy:
              "human-review:test",

            certifiedAt:
              100,

            reason:
              "Invalid attempt.",
          },
        }),
      /initial_competency_certification_candidate_not_ready/,
    );
  },
);


test(
  "M51.5j12 marks certification stale when candidate identity changes",
  () => {
    const candidate =
      readyCandidate();

    const certification =
      certifyInitialCompetency({
        candidate,

        decision: {
          certifiedBy:
            "human-review:test",

          certifiedAt:
            100,

          reason:
            "All competency domains were reviewed and accepted.",
        },
      });

    const changed = {
      ...candidate,

      candidateId:
        "initial-competency-assessment:changed",
    } as InitialCompetencyAssessmentCandidate;

    const validation =
      validateInitialCompetencyCertification({
        certification,

        currentCandidate:
          changed,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "initial-competency-certification-candidate-changed",
      ),
    );
  },
);
