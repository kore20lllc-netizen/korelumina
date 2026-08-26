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
  EDUCATIONAL_CORPUS_VERSION,
} from "./EducationalCorpus.js";

import type {
  EducationalCorpus,
} from "./EducationalCorpus.js";


export interface EducationalCorpusPersistenceOptions {
  storageRoot?:
    string;
}


export interface EducationalCorpusPersistenceStore {
  load():
    EducationalCorpus |
    null;

  save(
    corpus:
      EducationalCorpus,
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


function validateStoredEducationalCorpus(
  value:
    unknown,
): EducationalCorpus {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "educational_corpus_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.corpusVersion !==
    EDUCATIONAL_CORPUS_VERSION
  ) {
    throw new Error(
      "educational_corpus_persistence_version_invalid",
    );
  }

  if (
    record.state !==
    "ASSEMBLED"
  ) {
    throw new Error(
      "educational_corpus_persistence_state_invalid",
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
      "educational_corpus_persistence_id_invalid",
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
      "educational_corpus_persistence_day_zero_certification_invalid",
    );
  }

  if (
    typeof record.dayZeroCandidateId !==
      "string" ||
    !record.dayZeroCandidateId.startsWith(
      "genesis-day-zero-certification-candidate:",
    )
  ) {
    throw new Error(
      "educational_corpus_persistence_day_zero_candidate_invalid",
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
      "educational_corpus_persistence_source_contract_invalid",
    );
  }

  /*
   * Backward compatibility:
   * canonical-only persisted v1 corpora predate the explicit
   * historicalEvidence lane. Normalize those to null.
   */
  if (
    record.historicalEvidence ===
      undefined
  ) {
    record.historicalEvidence =
      null;
  }

  if (
    record.historicalEvidence !==
      null
  ) {
    if (
      !record.historicalEvidence ||
      typeof record.historicalEvidence !==
        "object" ||
      Array.isArray(
        record.historicalEvidence,
      )
    ) {
      throw new Error(
        "educational_corpus_persistence_historical_evidence_invalid",
      );
    }

    const historical =
      record.historicalEvidence as Record<
        string,
        unknown
      >;

    if (
      historical.version !==
        "educational-corpus-historical-evidence:v1" ||
      typeof historical.historicalEvidenceId !==
        "string" ||
      !historical.historicalEvidenceId.startsWith(
        "educational-corpus-historical-evidence:",
      ) ||
      !Array.isArray(
        historical.records,
      ) ||
      historical.governingAuthority !==
        false ||
      historical.educationalCorpusCertified !==
        false ||
      historical.initialCompetencyCertified !==
        false ||
      historical.chiefAgentActivationAuthorized !==
        false
    ) {
      throw new Error(
        "educational_corpus_persistence_historical_evidence_invalid",
      );
    }
  }

  if (
    !Array.isArray(
      record.items,
    ) ||
    !Array.isArray(
      record.excluded,
    )
  ) {
    throw new Error(
      "educational_corpus_persistence_content_invalid",
    );
  }

  if (
    record.educationalCorpusCertified !==
      false ||
    record.initialCompetencyCertified !==
      false ||
    record.chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "educational_corpus_persistence_downstream_boundary_invalid",
    );
  }

  return record as unknown as
    EducationalCorpus;
}


export class FileEducationalCorpusPersistenceStore
  implements
    EducationalCorpusPersistenceStore
{
  readonly storageRoot:
    string;

  readonly corpusFile:
    string;


  constructor(
    options:
      EducationalCorpusPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "knowledge-education",
          "educational-corpus",
        ),
      );

    this.corpusFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    EducationalCorpus |
    null {
    let raw:
      string;

    try {
      raw =
        readFileSync(
          this.corpusFile,
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
        "educational_corpus_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    return validateStoredEducationalCorpus(
      parsed,
    );
  }


  save(
    corpus:
      EducationalCorpus,
  ): void {
    const validated =
      validateStoredEducationalCorpus(
        corpus,
      );

    const existing =
      this.load();

    if (
      existing?.corpusId ===
      validated.corpusId
    ) {
      return;
    }

    atomicWriteJson(
      this.corpusFile,
      validated,
    );
  }
}
