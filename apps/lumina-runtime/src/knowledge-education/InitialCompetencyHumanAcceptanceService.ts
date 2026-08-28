import {
  acceptInitialCompetency,
  validateInitialCompetencyHumanAcceptance,
} from "./InitialCompetencyHumanAcceptance.js";

import type {
  InitialCompetencyHumanAcceptance,
  InitialCompetencyHumanAcceptanceDecision,
  InitialCompetencyHumanAcceptanceValidation,
} from "./InitialCompetencyHumanAcceptance.js";

import type {
  InitialCompetencyCertificationRuntimeProjection,
} from "./InitialCompetencyCertificationService.js";

import type {
  InitialCompetencyHumanAcceptancePersistenceStore,
} from "./InitialCompetencyHumanAcceptancePersistence.js";


export type InitialCompetencyHumanAcceptanceRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface InitialCompetencyHumanAcceptanceRuntimeProjection {
  state:
    InitialCompetencyHumanAcceptanceRuntimeState;

  certification:
    InitialCompetencyCertificationRuntimeProjection;

  acceptance:
    InitialCompetencyHumanAcceptance |
    null;

  validation:
    InitialCompetencyHumanAcceptanceValidation |
    null;

  downstream: {
    initialCompetencyCertified:
      boolean;

    humanAcceptanceRecorded:
      boolean;

    chiefAgentProductionWorkspaceAuthorized:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface InitialCompetencyCertificationReader {
  read():
    InitialCompetencyCertificationRuntimeProjection;
}


export class InitialCompetencyHumanAcceptanceService {
  constructor(
    private readonly persistence:
      InitialCompetencyHumanAcceptancePersistenceStore,

    private readonly certification:
      InitialCompetencyCertificationReader,
  ) {}


  read():
    InitialCompetencyHumanAcceptanceRuntimeProjection {
    const certification =
      this.certification
        .read();

    const acceptance =
      this.persistence
        .load();

    if (
      certification.state !==
        "VALID"
    ) {
      return {
        state:
          "BLOCKED",

        certification,

        acceptance,

        validation:
          null,

        downstream: {
          initialCompetencyCertified:
            certification.downstream
              .initialCompetencyCertified,

          humanAcceptanceRecorded:
            false,

          chiefAgentProductionWorkspaceAuthorized:
            false,

          chiefAgentActivationAuthorized:
            false,
        },
      };
    }

    if (
      !acceptance
    ) {
      return {
        state:
          "UNSET",

        certification,

        acceptance:
          null,

        validation:
          null,

        downstream: {
          initialCompetencyCertified:
            true,

          humanAcceptanceRecorded:
            false,

          chiefAgentProductionWorkspaceAuthorized:
            false,

          chiefAgentActivationAuthorized:
            false,
        },
      };
    }

    const validation =
      validateInitialCompetencyHumanAcceptance({
        acceptance,

        currentCertification:
          certification,
      });

    return {
      state:
        validation.state,

      certification,

      acceptance,

      validation,

      downstream: {
        initialCompetencyCertified:
          true,

        humanAcceptanceRecorded:
          validation.state ===
            "VALID",

        chiefAgentProductionWorkspaceAuthorized:
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    };
  }


  accept(
    decision:
      InitialCompetencyHumanAcceptanceDecision,
  ): InitialCompetencyHumanAcceptanceRuntimeProjection {
    const certification =
      this.certification
        .read();

    const acceptance =
      acceptInitialCompetency({
        certification,

        decision,
      });

    this.persistence
      .save(
        acceptance,
      );

    return this.read();
  }
}
