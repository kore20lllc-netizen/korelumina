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
  INITIAL_COMPETENCY_CERTIFICATION_VERSION,
} from "./InitialCompetencyCertification.js";

import type {
  InitialCompetencyCertification,
} from "./InitialCompetencyCertification.js";


export interface InitialCompetencyCertificationPersistenceOptions {
  storageRoot?:
    string;
}


export interface InitialCompetencyCertificationPersistenceStore {
  load():
    InitialCompetencyCertification |
    null;

  save(
    certification:
      InitialCompetencyCertification,
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


function validateStoredCertification(
  value:
    unknown,
): InitialCompetencyCertification {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "initial_competency_certification_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.certificationVersion !==
      INITIAL_COMPETENCY_CERTIFICATION_VERSION
  ) {
    throw new Error(
      "initial_competency_certification_persistence_version_invalid",
    );
  }

  if (
    record.state !==
      "CERTIFIED"
  ) {
    throw new Error(
      "initial_competency_certification_persistence_state_invalid",
    );
  }

  if (
    typeof record.certificationId !==
      "string" ||
    !record.certificationId.startsWith(
      "initial-competency-certification:",
    )
  ) {
    throw new Error(
      "initial_competency_certification_persistence_id_invalid",
    );
  }

  if (
    typeof record.candidateId !==
      "string" ||
    !record.candidateId.startsWith(
      "initial-competency-assessment:",
    )
  ) {
    throw new Error(
      "initial_competency_certification_persistence_candidate_invalid",
    );
  }

  if (
    record.assessmentVersion !==
      "initial-competency-assessment:v1"
  ) {
    throw new Error(
      "initial_competency_certification_persistence_assessment_version_invalid",
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
      "initial_competency_certification_persistence_corpus_certification_invalid",
    );
  }

  if (
    !Array.isArray(
      record.completedCompetencyIds,
    ) ||
    record.completedCompetencyIds.some(
      value =>
        typeof value !==
          "string" ||
        value.trim().length ===
          0,
    )
  ) {
    throw new Error(
      "initial_competency_certification_persistence_competencies_invalid",
    );
  }

  if (
    typeof record.certifiedBy !==
      "string" ||
    record.certifiedBy.trim()
      .length ===
      0
  ) {
    throw new Error(
      "initial_competency_certification_persistence_certifier_invalid",
    );
  }

  if (
    typeof record.certifiedAt !==
      "number" ||
    !Number.isFinite(
      record.certifiedAt,
    ) ||
    record.certifiedAt <=
      0
  ) {
    throw new Error(
      "initial_competency_certification_persistence_timestamp_invalid",
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
      "initial_competency_certification_persistence_reason_invalid",
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
      "initial_competency_certification_persistence_downstream_invalid",
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
    downstream.chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "initial_competency_certification_persistence_downstream_boundary_invalid",
    );
  }

  return record as unknown as
    InitialCompetencyCertification;
}


export class FileInitialCompetencyCertificationPersistenceStore
  implements
    InitialCompetencyCertificationPersistenceStore
{
  readonly storageRoot:
    string;

  readonly certificationFile:
    string;


  constructor(
    options:
      InitialCompetencyCertificationPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "knowledge-education",
          "initial-competency-certification",
        ),
      );

    this.certificationFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    InitialCompetencyCertification |
    null {
    let raw:
      string;

    try {
      raw =
        readFileSync(
          this.certificationFile,
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
        "initial_competency_certification_persistence_json_invalid",
      );
    }

    return validateStoredCertification(
      parsed,
    );
  }


  save(
    certification:
      InitialCompetencyCertification,
  ): void {
    validateStoredCertification(
      certification,
    );

    atomicWriteJson(
      this.certificationFile,
      certification,
    );
  }
}
