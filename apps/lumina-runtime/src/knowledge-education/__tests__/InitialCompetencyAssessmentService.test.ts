import assert from "node:assert/strict";
import test from "node:test";

import {
  InitialCompetencyAssessmentService,
} from "../InitialCompetencyAssessmentService.js";

import type {
  EducationalCorpusCertificationRuntimeProjection,
} from "../EducationalCorpusCertificationService.js";


test(
  "runtime initial competency assessment composes current education and corpus certification without mutation",
  () => {
    let educationReads =
      0;

    let certificationReads =
      0;

    const service =
      new InitialCompetencyAssessmentService(
        {
          snapshot: () => {
            educationReads +=
              1;

            return {
              state:
                "success",

              artifacts:
                [],

              modules:
                [],

              competencies: [
                {
                  id:
                    "authority-interpretation",

                  title:
                    "Authority interpretation",

                  description:
                    "Interpret governing authority.",

                  status:
                    "completed",

                  evidence:
                    "Validated constitutional curriculum.",
                },

                {
                  id:
                    "governed-retrieval",

                  title:
                    "Governed retrieval",

                  description:
                    "Retrieve governed knowledge.",

                  status:
                    "active",

                  evidence:
                    "Retrieval exercises remain.",
                },
              ],

              timeline:
                [],

              generatedAt:
                1,

              source:
                "canonical-knowledge",
            };
          },
        },

        {
          read: () => {
            certificationReads +=
              1;

            return {
              state:
                "VALID",

              candidate:
                null,

              certification: {
                certificationId:
                  "educational-corpus-certification:runtime",
              },

              validation:
                null,

              downstream: {
                initialCompetencyCertified:
                  false,

                chiefAgentActivationAuthorized:
                  false,
              },
            } as unknown as EducationalCorpusCertificationRuntimeProjection;
          },
        },
      );

    const assessment =
      service.read();

    assert.equal(
      educationReads,
      1,
    );

    assert.equal(
      certificationReads,
      1,
    );

    assert.equal(
      assessment.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      assessment.completedCompetencyIds,
      [
        "authority-interpretation",
      ],
    );

    assert.deepEqual(
      assessment.unresolvedCompetencyIds,
      [
        "governed-retrieval",
      ],
    );

    assert.deepEqual(
      assessment.blockers,
      [
        "initial-competency-evidence-incomplete",
      ],
    );

    assert.equal(
      assessment.humanReview.available,
      false,
    );

    assert.equal(
      assessment.downstream.initialCompetencyCertified,
      false,
    );

    assert.equal(
      assessment.downstream.chiefAgentActivationAuthorized,
      false,
    );
  },
);
