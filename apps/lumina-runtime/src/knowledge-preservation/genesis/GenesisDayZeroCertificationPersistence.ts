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
} from "../../projects/workspacePaths.js";

import {
  GENESIS_DAY_ZERO_CERTIFICATION_VERSION,
} from "./GenesisDayZeroCertification.js";

import type {
  GenesisDayZeroCertification,
} from "./GenesisDayZeroCertification.js";


export interface GenesisDayZeroCertificationPersistenceOptions {
  storageRoot?:
    string;
}


export interface GenesisDayZeroCertificationPersistenceStore {
  load():
    GenesisDayZeroCertification |
    null;

  save(
    certification:
      GenesisDayZeroCertification,
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
): GenesisDayZeroCertification {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.certificationVersion !==
    GENESIS_DAY_ZERO_CERTIFICATION_VERSION
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_version_invalid",
    );
  }

  if (
    record.state !==
    "CERTIFIED"
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_state_invalid",
    );
  }

  if (
    typeof record.certificationId !==
      "string" ||
    !record.certificationId.startsWith(
      "genesis-day-zero-certification:",
    )
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_id_invalid",
    );
  }

  if (
    typeof record.candidateId !==
      "string" ||
    !record.candidateId.startsWith(
      "genesis-day-zero-certification-candidate:",
    )
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_candidate_id_invalid",
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
      "genesis_day_zero_certification_persistence_certifier_invalid",
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
      "genesis_day_zero_certification_persistence_timestamp_invalid",
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
      "genesis_day_zero_certification_persistence_reason_invalid",
    );
  }

  if (
    !record.provenance ||
    typeof record.provenance !==
      "object" ||
    Array.isArray(
      record.provenance,
    )
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_provenance_invalid",
    );
  }

  if (
    !record.certifiedHistoricalGaps ||
    typeof record.certifiedHistoricalGaps !==
      "object" ||
    Array.isArray(
      record.certifiedHistoricalGaps,
    )
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_gaps_invalid",
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
      "genesis_day_zero_certification_persistence_downstream_invalid",
    );
  }

  const downstream =
    record.downstream as Record<
      string,
      unknown
    >;

  if (
    downstream.educationalCorpusCertified !==
      false ||
    downstream.initialCompetencyCertified !==
      false ||
    downstream.chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "genesis_day_zero_certification_persistence_downstream_boundary_invalid",
    );
  }

  return record as unknown as
    GenesisDayZeroCertification;
}


export class FileGenesisDayZeroCertificationPersistenceStore
  implements
    GenesisDayZeroCertificationPersistenceStore
{
  readonly storageRoot:
    string;

  readonly certificationFile:
    string;


  constructor(
    options:
      GenesisDayZeroCertificationPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "day-zero-certification",
        ),
      );

    this.certificationFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    GenesisDayZeroCertification |
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
        "genesis_day_zero_certification_persistence_corrupt_json",
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
      GenesisDayZeroCertification,
  ): void {
    const validated =
      validateStoredCertification(
        certification,
      );

    const existing =
      this.load();

    if (
      existing &&
      existing.certificationId ===
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
