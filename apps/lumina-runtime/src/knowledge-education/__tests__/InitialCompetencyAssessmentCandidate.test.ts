import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInitialCompetencyAssessmentCandidate,
} from "../InitialCompetencyAssessmentCandidate.js";

import type {
  EducationalCorpusCertificationRuntimeProjection,
} from "../EducationalCorpusCertificationService.js";


const validCorpusCertification = {
  state:
    "VALID",

  candidate:
    null,

  certification: {
    certificationId:
      "educational-corpus-certification:certified",
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


test(
  "initial competency assessment remains incomplete while required competency evidence is unresolved",
  () => {
    const candidate =
      buildInitialCompetencyAssessmentCandidate({
        corpusCertification:
          validCorpusCertification,

        education: {
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
                "Authority hierarchy.",

              status:
                "completed",

              evidence:
                "Constitutional curriculum reviewed.",
            },
            {
              id:
                "governed-retrieval",

              title:
                "Governed retrieval",

              description:
                "Governed retrieval.",

              status:
                "active",

              evidence:
                "Retrieval exercises remain.",
            },
            {
              id:
                "mission-boundaries",

              title:
                "Mission boundaries",

              description:
                "Mission boundaries.",

              status:
                "needs-review",

              evidence:
                "Mission curriculum review remains.",
            },
            {
              id:
                "explainable-grounding",

              title:
                "Explainable grounding",

              description:
                "Explainable grounding.",

              status:
                "blocked",

              evidence:
                "Curriculum gaps remain.",
            },
          ],

          timeline:
            [],

          generatedAt:
            1,

          source:
            "canonical-knowledge",
        },
      });

    assert.equal(
      candidate.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      candidate.completedCompetencyIds,
      [
        "authority-interpretation",
      ],
    );

    assert.deepEqual(
      candidate.unresolvedCompetencyIds,
      [
        "explainable-grounding",
        "governed-retrieval",
        "mission-boundaries",
      ],
    );

    assert.deepEqual(
      candidate.blockers,
      [
        "initial-competency-evidence-incomplete",
      ],
    );

    assert.equal(
      candidate.humanReview.required,
      true,
    );

    assert.equal(
      candidate.humanReview.available,
      false,
    );

    assert.equal(
      candidate.downstream
        .initialCompetencyCertified,
      false,
    );

    assert.equal(
      candidate.downstream
        .chiefAgentActivationAuthorized,
      false,
    );
  },
);


test(
  "initial competency assessment becomes reviewable only when every declared competency is completed",
  () => {
    const candidate =
      buildInitialCompetencyAssessmentCandidate({
        corpusCertification:
          validCorpusCertification,

        education: {
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
                "Authority hierarchy.",

              status:
                "completed",

              evidence:
                "Validated.",
            },
            {
              id:
                "runtime-truth-distinction",

              title:
                "Runtime truth",

              description:
                "Runtime truth boundary.",

              status:
                "completed",

              evidence:
                "Validated.",
            },
          ],

          timeline:
            [],

          generatedAt:
            1,

          source:
            "canonical-knowledge",
        },
      });

    assert.equal(
      candidate.state,
      "READY_FOR_HUMAN_REVIEW",
    );

    assert.deepEqual(
      candidate.unresolvedCompetencyIds,
      [],
    );

    assert.deepEqual(
      candidate.blockers,
      [],
    );

    assert.equal(
      candidate.humanReview.available,
      true,
    );

    assert.equal(
      candidate.downstream
        .initialCompetencyCertified,
      false,
    );
  },
);


test(
  "initial competency assessment fails closed without a valid Educational Corpus certification",
  () => {
    const candidate =
      buildInitialCompetencyAssessmentCandidate({
        corpusCertification: {
          ...validCorpusCertification,

          state:
            "STALE",
        } as never,

        education: {
          state:
            "success",

          artifacts:
            [],

          modules:
            [],

          competencies:
            [],

          timeline:
            [],

          generatedAt:
            1,

          source:
            "canonical-knowledge",
        },
      });

    assert.equal(
      candidate.state,
      "BLOCKED",
    );

    assert.ok(
      candidate.blockers.includes(
        "valid-educational-corpus-certification-required",
      ),
    );

    assert.equal(
      candidate.humanReview.available,
      false,
    );
  },
);
