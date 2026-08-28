import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeChiefAgentProductionWorkspace,
  validateChiefAgentProductionWorkspaceAuthorization,
} from "../ChiefAgentProductionWorkspaceAuthorization.js";

import type {
  InitialCompetencyHumanAcceptanceRuntimeProjection,
} from "../InitialCompetencyHumanAcceptanceService.js";


function validAcceptance():
  InitialCompetencyHumanAcceptanceRuntimeProjection {
  return {
    state:
      "VALID",

    certification: {
      state:
        "VALID",
    },

    acceptance: {
      acceptanceId:
        "initial-competency-human-acceptance:test",

      acceptanceVersion:
        "initial-competency-human-acceptance:v1",

      state:
        "ACCEPTED",

      initialCompetencyCertificationId:
        "initial-competency-certification:test",

      initialCompetencyCandidateId:
        "initial-competency-assessment:test",

      educationalCorpusCertificationId:
        "educational-corpus-certification:test",

      acceptedBy:
        "human-review:test",

      acceptedAt:
        100,

      reason:
        "Accepted.",

      downstream: {
        initialCompetencyCertified:
          true,

        humanAcceptanceRecorded:
          true,

        chiefAgentProductionWorkspaceAuthorized:
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    },

    validation: {
      state:
        "VALID",

      acceptanceId:
        "initial-competency-human-acceptance:test",

      currentInitialCompetencyCertificationId:
        "initial-competency-certification:test",

      blockers:
        [],
    },

    downstream: {
      initialCompetencyCertified:
        true,

      humanAcceptanceRecorded:
        true,

      chiefAgentProductionWorkspaceAuthorized:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  } as unknown as
    InitialCompetencyHumanAcceptanceRuntimeProjection;
}


test(
  "M51.5k9 authorizes production workspace creation only",
  () => {
    const acceptance =
      validAcceptance();

    const authorization =
      authorizeChiefAgentProductionWorkspace({
        acceptance,

        decision: {
          authorizedBy:
            "human-governance:test",

          authorityRole:
            "HUMAN_GOVERNANCE",

          authorizedAt:
            200,

          reason:
            "Human governance authorizes creation of the Chief Agent production workspace.",
        },
      });

    assert.equal(
      authorization.state,
      "AUTHORIZED",
    );

    assert.equal(
      authorization.downstream
        .chiefAgentProductionWorkspaceAuthorized,
      true,
    );

    assert.equal(
      authorization.downstream
        .chiefAgentProductionWorkspaceCreated,
      false,
    );

    assert.equal(
      authorization.downstream
        .chiefAgentActivationAuthorized,
      false,
    );

    assert.equal(
      authorization.downstream
        .chiefAgentActivated,
      false,
    );

    const validation =
      validateChiefAgentProductionWorkspaceAuthorization({
        authorization,

        currentAcceptance:
          acceptance,
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
  "M51.5k9 rejects authorization without valid human acceptance",
  () => {
    const acceptance =
      validAcceptance();

    acceptance.state =
      "STALE";

    assert.throws(
      () =>
        authorizeChiefAgentProductionWorkspace({
          acceptance,

          decision: {
            authorizedBy:
              "human-governance:test",

            authorityRole:
              "HUMAN_GOVERNANCE",

            authorizedAt:
              200,

            reason:
              "Invalid authorization.",
          },
        }),
      /chief_agent_production_workspace_authorization_acceptance_not_valid/,
    );
  },
);


test(
  "M51.5k9 marks authorization stale when human acceptance changes",
  () => {
    const acceptance =
      validAcceptance();

    const authorization =
      authorizeChiefAgentProductionWorkspace({
        acceptance,

        decision: {
          authorizedBy:
            "human-governance:test",

          authorityRole:
            "HUMAN_GOVERNANCE",

          authorizedAt:
            200,

          reason:
            "Authorize workspace creation.",
        },
      });

    const changed =
      validAcceptance();

    if (
      changed.acceptance
    ) {
      changed.acceptance = {
        ...changed.acceptance,

        acceptanceId:
          "initial-competency-human-acceptance:changed",
      };
    }

    const validation =
      validateChiefAgentProductionWorkspaceAuthorization({
        authorization,

        currentAcceptance:
          changed,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "human-acceptance-changed",
      ),
    );
  },
);
