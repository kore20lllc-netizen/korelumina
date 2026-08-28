import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptInitialCompetency,
  validateInitialCompetencyHumanAcceptance,
} from "../InitialCompetencyHumanAcceptance.js";

import type {
  InitialCompetencyCertificationRuntimeProjection,
} from "../InitialCompetencyCertificationService.js";


function validCertification():
  InitialCompetencyCertificationRuntimeProjection {
  return {
    state:
      "VALID",

    candidate: {
      candidateId:
        "initial-competency-assessment:test",
    },

    certification: {
      certificationId:
        "initial-competency-certification:test",

      certificationVersion:
        "initial-competency-certification:v1",

      state:
        "CERTIFIED",

      candidateId:
        "initial-competency-assessment:test",

      assessmentVersion:
        "initial-competency-assessment:v1",

      educationalCorpusCertificationId:
        "educational-corpus-certification:test",

      completedCompetencyIds: [
        "authority-interpretation",
      ],

      certifiedBy:
        "human-review:test",

      certifiedAt:
        100,

      reason:
        "Competency certified.",

      downstream: {
        initialCompetencyCertified:
          true,

        chiefAgentActivationAuthorized:
          false,
      },
    },

    validation: {
      state:
        "VALID",

      certificationId:
        "initial-competency-certification:test",

      currentCandidateId:
        "initial-competency-assessment:test",

      blockers:
        [],
    },

    downstream: {
      initialCompetencyCertified:
        true,

      chiefAgentActivationAuthorized:
        false,
    },
  } as unknown as
    InitialCompetencyCertificationRuntimeProjection;
}


test(
  "M51.5k2 accepts only a valid Initial Competency certification",
  () => {
    const certification =
      validCertification();

    const acceptance =
      acceptInitialCompetency({
        certification,

        decision: {
          acceptedBy:
            "human-review:test",

          acceptedAt:
            200,

          reason:
            "Human governance accepts the certified Initial Competency result.",
        },
      });

    assert.equal(
      acceptance.state,
      "ACCEPTED",
    );

    assert.equal(
      acceptance.initialCompetencyCertificationId,
      certification
        .certification
        ?.certificationId,
    );

    assert.equal(
      acceptance.downstream
        .initialCompetencyCertified,
      true,
    );

    assert.equal(
      acceptance.downstream
        .humanAcceptanceRecorded,
      true,
    );

    assert.equal(
      acceptance.downstream
        .chiefAgentProductionWorkspaceAuthorized,
      false,
    );

    assert.equal(
      acceptance.downstream
        .chiefAgentActivationAuthorized,
      false,
    );

    const validation =
      validateInitialCompetencyHumanAcceptance({
        acceptance,

        currentCertification:
          certification,
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
  "M51.5k2 rejects acceptance when Initial Competency certification is not valid",
  () => {
    const certification =
      validCertification();

    certification.state =
      "STALE";

    assert.throws(
      () =>
        acceptInitialCompetency({
          certification,

          decision: {
            acceptedBy:
              "human-review:test",

            acceptedAt:
              200,

            reason:
              "Invalid acceptance attempt.",
          },
        }),
      /initial_competency_human_acceptance_certification_not_valid/,
    );
  },
);


test(
  "M51.5k2 marks acceptance stale when certification identity changes",
  () => {
    const certification =
      validCertification();

    const acceptance =
      acceptInitialCompetency({
        certification,

        decision: {
          acceptedBy:
            "human-review:test",

          acceptedAt:
            200,

          reason:
            "Human governance accepts the certification.",
        },
      });

    const changed =
      validCertification();

    if (
      changed.certification
    ) {
      changed.certification = {
        ...changed.certification,

        certificationId:
          "initial-competency-certification:changed",
      };
    }

    const validation =
      validateInitialCompetencyHumanAcceptance({
        acceptance,

        currentCertification:
          changed,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "initial-competency-certification-changed",
      ),
    );
  },
);
