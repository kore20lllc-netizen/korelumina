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
  EDUCATIONAL_AUTHORITY_RESOLUTION_VERSION,
} from "./EducationalAuthorityResolution.js";

import type {
  EducationalAuthorityResolution,
} from "./EducationalAuthorityResolution.js";


export interface EducationalAuthorityResolutionPersistenceOptions {
  storageRoot?:
    string;
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


function validateResolution(
  value:
    unknown,
): EducationalAuthorityResolution {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.version !==
      EDUCATIONAL_AUTHORITY_RESOLUTION_VERSION
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_version_invalid",
    );
  }

  if (
    typeof record.resolutionId !==
      "string" ||
    !record.resolutionId.startsWith(
      "educational-authority-resolution:",
    )
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_id_invalid",
    );
  }

  if (
    typeof record.artifactId !==
      "string" ||
    !record.artifactId.trim()
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_artifact_invalid",
    );
  }

  if (
    typeof record.learningRole !==
      "string" ||
    !record.learningRole.trim()
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_learning_role_invalid",
    );
  }

  if (
    record.decision !==
      "APPROVED"
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_decision_invalid",
    );
  }

  if (
    typeof record.reviewerId !==
      "string" ||
    !record.reviewerId.trim()
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_reviewer_invalid",
    );
  }

  if (
    typeof record.reviewedAt !==
      "number" ||
    !Number.isFinite(
      record.reviewedAt,
    ) ||
    record.reviewedAt <=
      0
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_reviewed_at_invalid",
    );
  }

  if (
    typeof record.reason !==
      "string" ||
    !record.reason.trim()
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_reason_invalid",
    );
  }

  if (
    typeof record.authorityPolicyVersion !==
      "string" ||
    !record.authorityPolicyVersion.trim()
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_policy_invalid",
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
      "educational_authority_resolution_persistence_day_zero_invalid",
    );
  }

  const downstream =
    record.downstream;

  if (
    !downstream ||
    typeof downstream !==
      "object" ||
    Array.isArray(
      downstream,
    )
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_downstream_invalid",
    );
  }

  const boundary =
    downstream as Record<
      string,
      unknown
    >;

  if (
    boundary.educationalCorpusCertified !==
      false ||
    boundary.initialCompetencyCertified !==
      false ||
    boundary.chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "educational_authority_resolution_persistence_downstream_boundary_invalid",
    );
  }

  return record as unknown as
    EducationalAuthorityResolution;
}


export class FileEducationalAuthorityResolutionStore {
  readonly storageRoot:
    string;


  constructor(
    options:
      EducationalAuthorityResolutionPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "knowledge-education",
          "authority-resolutions",
        ),
      );
  }


  private fileFor(
    artifactId:
      string,
  ): string {
    const safe =
      Buffer.from(
        artifactId,
        "utf8",
      )
        .toString(
          "base64url",
        );

    return path.join(
      this.storageRoot,
      `${safe}.json`,
    );
  }


  load(
    artifactId:
      string,
  ): EducationalAuthorityResolution |
    null {
    const file =
      this.fileFor(
        artifactId,
      );

    let raw:
      string;

    try {
      raw =
        readFileSync(
          file,
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
        "educational_authority_resolution_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    const resolution =
      validateResolution(
        parsed,
      );

    if (
      resolution.artifactId !==
        artifactId
    ) {
      throw new Error(
        "educational_authority_resolution_persistence_artifact_mismatch",
      );
    }

    return resolution;
  }


  save(
    resolution:
      EducationalAuthorityResolution,
  ): EducationalAuthorityResolution {
    const validated =
      validateResolution(
        resolution,
      );

    const existing =
      this.load(
        validated.artifactId,
      );

    if (
      existing
    ) {
      if (
        existing.resolutionId ===
          validated.resolutionId
      ) {
        return existing;
      }

      throw new Error(
        "educational_authority_resolution_already_exists",
      );
    }

    atomicWriteJson(
      this.fileFor(
        validated.artifactId,
      ),
      validated,
    );

    return validated;
  }
}
