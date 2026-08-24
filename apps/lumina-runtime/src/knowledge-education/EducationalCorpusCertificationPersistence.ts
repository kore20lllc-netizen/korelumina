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
  EDUCATIONAL_CORPUS_CERTIFICATION_VERSION,
} from "./EducationalCorpusCertification.js";

import type {
  EducationalCorpusCertification,
} from "./EducationalCorpusCertification.js";


export interface EducationalCorpusCertificationPersistenceOptions {
  storageRoot?:
    string;
}


export interface EducationalCorpusCertificationPersistenceStore {
  load():
    EducationalCorpusCertification |
    null;

  save(
    certification:
      EducationalCorpusCertification,
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
): EducationalCorpusCertification {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.certificationVersion !==
    EDUCATIONAL_CORPUS_CERTIFICATION_VERSION
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_version_invalid",
    );
  }

  if (
    record.state !==
    "CERTIFIED"
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_state_invalid",
    );
  }

  if (
    typeof record.certificationId !==
      "string" ||
    !record.certificationId.startsWith(
      "educational-corpus-certification:",
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_id_invalid",
    );
  }

  if (
    typeof record.candidateId !==
      "string" ||
    !record.candidateId.startsWith(
      "educational-corpus-certification-candidate:",
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_candidate_id_invalid",
    );
  }

  if (
    typeof record.corpusId !==
      "string" ||
    !record.corpusId.startsWith(
      "educational-corpus:",
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_corpus_id_invalid",
    );
  }

  if (
    typeof record.sourceContractId !==
      "string" ||
    !record.sourceContractId.startsWith(
      "educational-corpus-source-contract:",
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_source_contract_invalid",
    );
  }

  if (
    typeof record.dayZeroCertificationId !==
      "string" ||
    !record.dayZeroCertificationId.startsWith(
      "genesis-day-zero-certification:",
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_day_zero_invalid",
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
      "educational_corpus_certification_persistence_certifier_invalid",
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
      "educational_corpus_certification_persistence_timestamp_invalid",
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
      "educational_corpus_certification_persistence_reason_invalid",
    );
  }

  if (
    !record.constitutionalCoverage ||
    typeof record.constitutionalCoverage !==
      "object" ||
    Array.isArray(
      record.constitutionalCoverage,
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_coverage_invalid",
    );
  }

  if (
    !Array.isArray(
      record.acknowledgedExcludedArtifactIds,
    )
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_exclusions_invalid",
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
      "educational_corpus_certification_persistence_downstream_invalid",
    );
  }

  const downstream =
    record.downstream as Record<
      string,
      unknown
    >;

  if (
    downstream.initialCompetencyCertified !==
      false ||
    downstream.chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "educational_corpus_certification_persistence_downstream_boundary_invalid",
    );
  }

  return record as unknown as
    EducationalCorpusCertification;
}


export class FileEducationalCorpusCertificationPersistenceStore
  implements
    EducationalCorpusCertificationPersistenceStore
{
  readonly storageRoot:
    string;

  readonly certificationFile:
    string;


  constructor(
    options:
      EducationalCorpusCertificationPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "knowledge-education",
          "educational-corpus-certification",
        ),
      );

    this.certificationFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    EducationalCorpusCertification |
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
    } catch (
      error
    ) {
      throw new Error(
        "educational_corpus_certification_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    return validateStoredCertification(
      parsed,
    );
  }


  save(
    certification:
      EducationalCorpusCertification,
  ): void {
    const validated =
      validateStoredCertification(
        certification,
      );

    const existing =
      this.load();

    if (
      existing?.certificationId ===
      validated.certificationId
    ) {
      return;
    }

    atomicWriteJson(
      this.certificationFile,
      validated,
    );
  }
}
