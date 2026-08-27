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
  INITIAL_COMPETENCY_EVIDENCE_VERSION,
} from "./InitialCompetencyEvidenceContract.js";

import type {
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";


export interface InitialCompetencyEvidencePersistenceOptions {
  storageRoot?:
    string;
}


export interface InitialCompetencyEvidencePersistenceStore {
  list():
    readonly InitialCompetencyEvidenceRecord[];

  get(
    evidenceId:
      string,
  ):
    InitialCompetencyEvidenceRecord |
    null;

  save(
    evidence:
      InitialCompetencyEvidenceRecord,
  ): void;
}


interface InitialCompetencyEvidenceRegistry {
  version:
    typeof INITIAL_COMPETENCY_EVIDENCE_VERSION;

  records:
    InitialCompetencyEvidenceRecord[];
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


function nonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}


function positiveTimestamp(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    ) &&
    value >
      0
  );
}


function validateStoredEvidence(
  value:
    unknown,
): InitialCompetencyEvidenceRecord {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "initial_competency_evidence_persistence_record_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    !nonEmptyString(
      record.evidenceId,
    ) ||
    !nonEmptyString(
      record.competencyId,
    ) ||
    !nonEmptyString(
      record.sourceRef,
    ) ||
    !nonEmptyString(
      record.claim,
    ) ||
    !positiveTimestamp(
      record.observedAt,
    )
  ) {
    throw new Error(
      "initial_competency_evidence_persistence_identity_invalid",
    );
  }

  if (
    ![
      "canonical-knowledge",
      "organizational-memory",
      "runtime",
      "mission",
      "human-review",
    ].includes(
      String(
        record.source,
      ),
    )
  ) {
    throw new Error(
      "initial_competency_evidence_persistence_source_invalid",
    );
  }

  if (
    ![
      "PENDING",
      "VALIDATED",
      "REJECTED",
    ].includes(
      String(
        record.validationState,
      ),
    )
  ) {
    throw new Error(
      "initial_competency_evidence_persistence_validation_state_invalid",
    );
  }

  if (
    record.validationState ===
      "PENDING"
  ) {
    if (
      record.validatedBy !==
        null ||
      record.validatedAt !==
        null
    ) {
      throw new Error(
        "initial_competency_evidence_persistence_pending_proof_invalid",
      );
    }
  } else if (
    !nonEmptyString(
      record.validatedBy,
    ) ||
    !positiveTimestamp(
      record.validatedAt,
    )
  ) {
    throw new Error(
      "initial_competency_evidence_persistence_validation_proof_invalid",
    );
  }

  return record as unknown as
    InitialCompetencyEvidenceRecord;
}


function validateRegistry(
  value:
    unknown,
): InitialCompetencyEvidenceRegistry {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "initial_competency_evidence_persistence_registry_invalid",
    );
  }

  const registry =
    value as Record<
      string,
      unknown
    >;

  if (
    registry.version !==
      INITIAL_COMPETENCY_EVIDENCE_VERSION ||
    !Array.isArray(
      registry.records,
    )
  ) {
    throw new Error(
      "initial_competency_evidence_persistence_registry_invalid",
    );
  }

  const records =
    registry.records.map(
      validateStoredEvidence,
    );

  const ids =
    new Set<string>();

  for (
    const record of
      records
  ) {
    if (
      ids.has(
        record.evidenceId,
      )
    ) {
      throw new Error(
        "initial_competency_evidence_persistence_duplicate_id",
      );
    }

    ids.add(
      record.evidenceId,
    );
  }

  return {
    version:
      INITIAL_COMPETENCY_EVIDENCE_VERSION,

    records,
  };
}


export class FileInitialCompetencyEvidencePersistenceStore
  implements
    InitialCompetencyEvidencePersistenceStore
{
  readonly storageRoot:
    string;

  readonly registryFile:
    string;


  constructor(
    options:
      InitialCompetencyEvidencePersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "knowledge-education",
          "initial-competency-evidence",
        ),
      );

    this.registryFile =
      path.join(
        this.storageRoot,
        "registry.json",
      );
  }


  private readRegistry():
    InitialCompetencyEvidenceRegistry {
    let raw:
      string;

    try {
      raw =
        readFileSync(
          this.registryFile,
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
        return {
          version:
            INITIAL_COMPETENCY_EVIDENCE_VERSION,

          records:
            [],
        };
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
        "initial_competency_evidence_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    return validateRegistry(
      parsed,
    );
  }


  list():
    readonly InitialCompetencyEvidenceRecord[] {
    return this
      .readRegistry()
      .records
      .map(
        record => ({
          ...record,
        }),
      );
  }


  get(
    evidenceId:
      string,
  ):
    InitialCompetencyEvidenceRecord |
    null {
    return this
      .readRegistry()
      .records
      .find(
        record =>
          record.evidenceId ===
            evidenceId,
      ) ??
      null;
  }


  save(
    evidence:
      InitialCompetencyEvidenceRecord,
  ): void {
    const validated =
      validateStoredEvidence(
        evidence,
      );

    const registry =
      this.readRegistry();

    const existingIndex =
      registry.records.findIndex(
        record =>
          record.evidenceId ===
            validated.evidenceId,
      );

    if (
      existingIndex >=
        0
    ) {
      registry.records[
        existingIndex
      ] =
        validated;
    } else {
      registry.records.push(
        validated,
      );
    }

    registry.records.sort(
      (
        left,
        right,
      ) =>
        left.evidenceId.localeCompare(
          right.evidenceId,
        ),
    );

    atomicWriteJson(
      this.registryFile,
      registry,
    );
  }
}
