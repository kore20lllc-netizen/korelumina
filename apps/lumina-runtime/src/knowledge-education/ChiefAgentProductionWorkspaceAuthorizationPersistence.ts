import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import path from "node:path";

import {
  getRuntimeDataRoot,
} from "../projects/workspacePaths.js";

import {
  CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORIZATION_VERSION,
  CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORITY_ROLE,
} from "./ChiefAgentProductionWorkspaceAuthorization.js";

import type {
  ChiefAgentProductionWorkspaceAuthorization,
} from "./ChiefAgentProductionWorkspaceAuthorization.js";


export interface ChiefAgentProductionWorkspaceAuthorizationPersistenceOptions {
  storageRoot?:
    string;
}


export interface ChiefAgentProductionWorkspaceAuthorizationPersistenceStore {
  load():
    ChiefAgentProductionWorkspaceAuthorization |
    null;

  save(
    authorization:
      ChiefAgentProductionWorkspaceAuthorization,
  ): void;
}


function atomicWriteJson(
  file:
    string,

  value:
    unknown,
): void {
  mkdirSync(
    path.dirname(
      file,
    ),
    {
      recursive:
        true,
    },
  );

  const temporary =
    `${file}.tmp-${process.pid}`;

  try {
    writeFileSync(
      temporary,
      `${JSON.stringify(
        value,
        null,
        2,
      )}\n`,
      "utf8",
    );

    renameSync(
      temporary,
      file,
    );
  } finally {
    rmSync(
      temporary,
      {
        force:
          true,
      },
    );
  }
}


function validateStoredAuthorization(
  value:
    unknown,
): ChiefAgentProductionWorkspaceAuthorization {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.authorizationVersion !==
      CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORIZATION_VERSION ||
    record.state !==
      "AUTHORIZED"
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_contract_invalid",
    );
  }

  if (
    typeof record.authorizationId !==
      "string" ||
    !record.authorizationId.startsWith(
      "chief-agent-production-workspace-authorization:",
    )
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_id_invalid",
    );
  }

  if (
    typeof record.humanAcceptanceId !==
      "string" ||
    !record.humanAcceptanceId.startsWith(
      "initial-competency-human-acceptance:",
    )
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_acceptance_invalid",
    );
  }

  if (
    typeof record.initialCompetencyCertificationId !==
      "string" ||
    !record.initialCompetencyCertificationId.startsWith(
      "initial-competency-certification:",
    )
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_certification_invalid",
    );
  }

  if (
    record.authorityRole !==
      CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORITY_ROLE
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_role_invalid",
    );
  }

  if (
    typeof record.authorizedBy !==
      "string" ||
    record.authorizedBy.trim()
      .length ===
      0
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_authorizer_invalid",
    );
  }

  if (
    typeof record.authorizedAt !==
      "number" ||
    !Number.isFinite(
      record.authorizedAt,
    ) ||
    record.authorizedAt <=
      0
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_timestamp_invalid",
    );
  }

  if (
    typeof record.reason !==
      "string" ||
    record.reason.trim()
      .length ===
      0
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_reason_invalid",
    );
  }

  if (
    !record.downstream ||
    typeof record.downstream !==
      "object" ||
    Array.isArray(
      record.downstream,
    )
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_downstream_invalid",
    );
  }

  const downstream =
    record.downstream as Record<
      string,
      unknown
    >;

  if (
    downstream.initialCompetencyCertified !==
      true ||
    downstream.humanAcceptanceRecorded !==
      true ||
    downstream.chiefAgentProductionWorkspaceAuthorized !==
      true ||
    downstream.chiefAgentProductionWorkspaceCreated !==
      false ||
    downstream.chiefAgentActivationAuthorized !==
      false ||
    downstream.chiefAgentActivated !==
      false
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_persistence_boundary_invalid",
    );
  }

  return record as unknown as
    ChiefAgentProductionWorkspaceAuthorization;
}


export class FileChiefAgentProductionWorkspaceAuthorizationPersistenceStore
  implements
    ChiefAgentProductionWorkspaceAuthorizationPersistenceStore
{
  readonly storageRoot:
    string;

  readonly authorizationFile:
    string;


  constructor(
    options:
      ChiefAgentProductionWorkspaceAuthorizationPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "knowledge-education",
          "chief-agent-production-workspace-authorization",
        ),
      );

    this.authorizationFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    ChiefAgentProductionWorkspaceAuthorization |
    null {
    let raw:
      string;

    try {
      raw =
        readFileSync(
          this.authorizationFile,
          "utf8",
        );
    } catch (
      error
    ) {
      if (
        (
          error as {
            code?:
              string;
          }
        ).code ===
          "ENOENT"
      ) {
        return null;
      }

      throw error;
    }

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          raw,
        );
    } catch {
      throw new Error(
        "chief_agent_production_workspace_authorization_persistence_json_invalid",
      );
    }

    return validateStoredAuthorization(
      parsed,
    );
  }


  save(
    authorization:
      ChiefAgentProductionWorkspaceAuthorization,
  ): void {
    validateStoredAuthorization(
      authorization,
    );

    atomicWriteJson(
      this.authorizationFile,
      authorization,
    );
  }
}
