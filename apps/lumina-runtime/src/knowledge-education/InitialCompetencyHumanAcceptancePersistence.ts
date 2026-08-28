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
  INITIAL_COMPETENCY_HUMAN_ACCEPTANCE_VERSION,
} from "./InitialCompetencyHumanAcceptance.js";

import type {
  InitialCompetencyHumanAcceptance,
} from "./InitialCompetencyHumanAcceptance.js";


export interface InitialCompetencyHumanAcceptancePersistenceOptions {
  storageRoot?:
    string;
}


export interface InitialCompetencyHumanAcceptancePersistenceStore {
  load():
    InitialCompetencyHumanAcceptance |
    null;

  save(
    acceptance:
      InitialCompetencyHumanAcceptance,
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


function validateStoredAcceptance(
  value:
    unknown,
): InitialCompetencyHumanAcceptance {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.acceptanceVersion !==
      INITIAL_COMPETENCY_HUMAN_ACCEPTANCE_VERSION
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_version_invalid",
    );
  }

  if (
    record.state !==
      "ACCEPTED"
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_state_invalid",
    );
  }

  if (
    typeof record.acceptanceId !==
      "string" ||
    !record.acceptanceId.startsWith(
      "initial-competency-human-acceptance:",
    )
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_id_invalid",
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
      "initial_competency_human_acceptance_persistence_certification_invalid",
    );
  }

  if (
    typeof record.initialCompetencyCandidateId !==
      "string" ||
    !record.initialCompetencyCandidateId.startsWith(
      "initial-competency-assessment:",
    )
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_candidate_invalid",
    );
  }

  if (
    typeof record.educationalCorpusCertificationId !==
      "string" ||
    !record.educationalCorpusCertificationId.startsWith(
      "educational-corpus-certification:",
    )
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_corpus_certification_invalid",
    );
  }

  if (
    typeof record.acceptedBy !==
      "string" ||
    record.acceptedBy.trim()
      .length ===
      0
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_acceptor_invalid",
    );
  }

  if (
    typeof record.acceptedAt !==
      "number" ||
    !Number.isFinite(
      record.acceptedAt,
    ) ||
    record.acceptedAt <=
      0
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_timestamp_invalid",
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
      "initial_competency_human_acceptance_persistence_reason_invalid",
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
      "initial_competency_human_acceptance_persistence_downstream_invalid",
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
      false ||
    downstream.chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "initial_competency_human_acceptance_persistence_downstream_boundary_invalid",
    );
  }

  return record as unknown as
    InitialCompetencyHumanAcceptance;
}


export class FileInitialCompetencyHumanAcceptancePersistenceStore
  implements
    InitialCompetencyHumanAcceptancePersistenceStore
{
  readonly storageRoot:
    string;

  readonly acceptanceFile:
    string;


  constructor(
    options:
      InitialCompetencyHumanAcceptancePersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "knowledge-education",
          "initial-competency-human-acceptance",
        ),
      );

    this.acceptanceFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    InitialCompetencyHumanAcceptance |
    null {
    let raw:
      string;

    try {
      raw =
        readFileSync(
          this.acceptanceFile,
          "utf8",
        );
    } catch (
      error
    ) {
      const code =
        (
          error as {
            code?:
              string;
          }
        ).code;

      if (
        code ===
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
        "initial_competency_human_acceptance_persistence_json_invalid",
      );
    }

    return validateStoredAcceptance(
      parsed,
    );
  }


  save(
    acceptance:
      InitialCompetencyHumanAcceptance,
  ): void {
    validateStoredAcceptance(
      acceptance,
    );

    atomicWriteJson(
      this.acceptanceFile,
      acceptance,
    );
  }
}
