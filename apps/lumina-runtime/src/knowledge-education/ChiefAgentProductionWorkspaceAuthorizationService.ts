import {
  authorizeChiefAgentProductionWorkspace,
  validateChiefAgentProductionWorkspaceAuthorization,
} from "./ChiefAgentProductionWorkspaceAuthorization.js";

import type {
  ChiefAgentProductionWorkspaceAuthorization,
  ChiefAgentProductionWorkspaceAuthorizationDecision,
  ChiefAgentProductionWorkspaceAuthorizationValidation,
} from "./ChiefAgentProductionWorkspaceAuthorization.js";

import type {
  InitialCompetencyHumanAcceptanceRuntimeProjection,
} from "./InitialCompetencyHumanAcceptanceService.js";

import type {
  ChiefAgentProductionWorkspaceAuthorizationPersistenceStore,
} from "./ChiefAgentProductionWorkspaceAuthorizationPersistence.js";


export type ChiefAgentProductionWorkspaceAuthorizationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface ChiefAgentProductionWorkspaceAuthorizationRuntimeProjection {
  state:
    ChiefAgentProductionWorkspaceAuthorizationRuntimeState;

  acceptance:
    InitialCompetencyHumanAcceptanceRuntimeProjection;

  authorization:
    ChiefAgentProductionWorkspaceAuthorization |
    null;

  validation:
    ChiefAgentProductionWorkspaceAuthorizationValidation |
    null;

  downstream: {
    initialCompetencyCertified:
      boolean;

    humanAcceptanceRecorded:
      boolean;

    chiefAgentProductionWorkspaceAuthorized:
      boolean;

    chiefAgentProductionWorkspaceCreated:
      false;

    chiefAgentActivationAuthorized:
      false;

    chiefAgentActivated:
      false;
  };
}


export interface InitialCompetencyHumanAcceptanceReader {
  read():
    InitialCompetencyHumanAcceptanceRuntimeProjection;
}


export class ChiefAgentProductionWorkspaceAuthorizationService {
  constructor(
    private readonly persistence:
      ChiefAgentProductionWorkspaceAuthorizationPersistenceStore,

    private readonly acceptance:
      InitialCompetencyHumanAcceptanceReader,
  ) {}


  read():
    ChiefAgentProductionWorkspaceAuthorizationRuntimeProjection {
    const acceptance =
      this.acceptance
        .read();

    const authorization =
      this.persistence
        .load();

    if (
      acceptance.state !==
        "VALID"
    ) {
      return {
        state:
          "BLOCKED",

        acceptance,

        authorization,

        validation:
          null,

        downstream: {
          initialCompetencyCertified:
            acceptance.downstream
              .initialCompetencyCertified,

          humanAcceptanceRecorded:
            false,

          chiefAgentProductionWorkspaceAuthorized:
            false,

          chiefAgentProductionWorkspaceCreated:
            false,

          chiefAgentActivationAuthorized:
            false,

          chiefAgentActivated:
            false,
        },
      };
    }

    if (
      authorization ===
        null
    ) {
      return {
        state:
          "UNSET",

        acceptance,

        authorization:
          null,

        validation:
          null,

        downstream: {
          initialCompetencyCertified:
            true,

          humanAcceptanceRecorded:
            true,

          chiefAgentProductionWorkspaceAuthorized:
            false,

          chiefAgentProductionWorkspaceCreated:
            false,

          chiefAgentActivationAuthorized:
            false,

          chiefAgentActivated:
            false,
        },
      };
    }

    const validation =
      validateChiefAgentProductionWorkspaceAuthorization({
        authorization,

        currentAcceptance:
          acceptance,
      });

    return {
      state:
        validation.state,

      acceptance,

      authorization,

      validation,

      downstream: {
        initialCompetencyCertified:
          true,

        humanAcceptanceRecorded:
          true,

        chiefAgentProductionWorkspaceAuthorized:
          validation.state ===
            "VALID",

        chiefAgentProductionWorkspaceCreated:
          false,

        chiefAgentActivationAuthorized:
          false,

        chiefAgentActivated:
          false,
      },
    };
  }


  authorize(
    decision:
      ChiefAgentProductionWorkspaceAuthorizationDecision,
  ): ChiefAgentProductionWorkspaceAuthorizationRuntimeProjection {
    const acceptance =
      this.acceptance
        .read();

    const authorization =
      authorizeChiefAgentProductionWorkspace({
        acceptance,

        decision,
      });

    this.persistence
      .save(
        authorization,
      );

    return this.read();
  }
}
