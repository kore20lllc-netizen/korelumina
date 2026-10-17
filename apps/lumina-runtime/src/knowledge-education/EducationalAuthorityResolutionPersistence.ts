import {
  mkdirSync,
  readdirSync,
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


/*
 * Educational authority resolutions are versioned per Day-0
 * Genesis certification.
 *
 * A human authority decision is bound to the Day-0 certification
 * it was made against. When Day-0 is re-certified, the earlier
 * decision remains preserved as history and a new decision may be
 * recorded against the new certification. Within one Day-0
 * certification, a resolution can never be silently replaced.
 *
 * Layout:
 *
 *   <root>/<artifact>.json                 legacy v1 record (read-only)
 *   <root>/<artifact>/<day-zero>.json      versioned records
 *
 * Legacy records are read as history and are never rewritten.
 */
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


  private static encode(
    value:
      string,
  ): string {
    return Buffer.from(
      value,
      "utf8",
    )
      .toString(
        "base64url",
      );
  }


  private legacyFileFor(
    artifactId:
      string,
  ): string {
    return path.join(
      this.storageRoot,
      `${FileEducationalAuthorityResolutionStore.encode(
        artifactId,
      )}.json`,
    );
  }


  private versionDirectoryFor(
    artifactId:
      string,
  ): string {
    return path.join(
      this.storageRoot,
      FileEducationalAuthorityResolutionStore.encode(
        artifactId,
      ),
    );
  }


  private versionFileFor(
    artifactId:
      string,

    dayZeroCertificationId:
      string,
  ): string {
    return path.join(
      this.versionDirectoryFor(
        artifactId,
      ),
      `${FileEducationalAuthorityResolutionStore.encode(
        dayZeroCertificationId,
      )}.json`,
    );
  }


  private readRecord(
    file:
      string,

    artifactId:
      string,
  ): EducationalAuthorityResolution |
    null {
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


  private listVersionFiles(
    artifactId:
      string,
  ): string[] {
    try {
      return readdirSync(
        this.versionDirectoryFor(
          artifactId,
        ),
      )
        .filter(
          name =>
            name.endsWith(
              ".json",
            ),
        )
        .sort()
        .map(
          name =>
            path.join(
              this.versionDirectoryFor(
                artifactId,
              ),
              name,
            ),
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
        return [];
      }

      throw error;
    }
  }


  /*
   * Every preserved resolution for an artifact, across all Day-0
   * certifications, ordered by review time.
   */
  list(
    artifactId:
      string,
  ): EducationalAuthorityResolution[] {
    const byDayZero =
      new Map<
        string,
        EducationalAuthorityResolution
      >();

    const accept = (
      resolution:
        EducationalAuthorityResolution,
    ): void => {
      const existing =
        byDayZero.get(
          resolution.dayZeroCertificationId,
        );

      if (
        existing &&
        existing.resolutionId !==
          resolution.resolutionId
      ) {
        throw new Error(
          "educational_authority_resolution_persistence_day_zero_conflict",
        );
      }

      byDayZero.set(
        resolution.dayZeroCertificationId,
        resolution,
      );
    };

    const legacy =
      this.readRecord(
        this.legacyFileFor(
          artifactId,
        ),
        artifactId,
      );

    if (
      legacy
    ) {
      accept(
        legacy,
      );
    }

    for (
      const file of
      this.listVersionFiles(
        artifactId,
      )
    ) {
      const resolution =
        this.readRecord(
          file,
          artifactId,
        );

      if (
        !resolution
      ) {
        continue;
      }

      if (
        file !==
          this.versionFileFor(
            artifactId,
            resolution.dayZeroCertificationId,
          )
      ) {
        throw new Error(
          "educational_authority_resolution_persistence_day_zero_mismatch",
        );
      }

      accept(
        resolution,
      );
    }

    return [
      ...byDayZero.values(),
    ].sort(
      (
        left,
        right,
      ) =>
        left.reviewedAt -
          right.reviewedAt ||
        left.resolutionId.localeCompare(
          right.resolutionId,
        ),
    );
  }


  /*
   * The resolution recorded for an artifact against one specific
   * Day-0 certification, or null.
   */
  load(
    artifactId:
      string,

    dayZeroCertificationId:
      string,
  ): EducationalAuthorityResolution |
    null {
    return (
      this.list(
        artifactId,
      )
        .find(
          resolution =>
            resolution.dayZeroCertificationId ===
              dayZeroCertificationId,
        ) ??
      null
    );
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
        validated.dayZeroCertificationId,
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
      this.versionFileFor(
        validated.artifactId,
        validated.dayZeroCertificationId,
      ),
      validated,
    );

    return validated;
  }
}
