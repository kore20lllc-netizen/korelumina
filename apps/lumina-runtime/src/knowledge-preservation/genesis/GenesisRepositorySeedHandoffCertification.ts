import {
  createHash,
} from "node:crypto";

import type {
  GenesisKnowledgeLifecycleProjection,
  GenesisKnowledgeLifecycleRecord,
} from "./GenesisKnowledgeLifecycleCorrelation.js";

import type {
  GenesisRepositorySeedCertification,
} from "./GenesisRepositorySeedCertification.js";


export type GenesisRepositorySeedHandoffCertificationId =
  `genesis-repository-seed-handoff:${string}`;

export type GenesisRepositorySeedHandoffState =
  | "CERTIFIED"
  | "INCOMPLETE"
  | "BLOCKED";

export type GenesisRepositorySeedHandoffRecordState =
  | "handed-off"
  | "not-correlated"
  | "ambiguous"
  | "missing";

export interface GenesisRepositorySeedHandoffRecord {
  evidenceId:
    string;

  state:
    GenesisRepositorySeedHandoffRecordState;

  manufacturingRunId:
    string | null;

  matchingManufacturingRunIds:
    readonly string[];

  manufacturingStatus:
    GenesisKnowledgeLifecycleRecord[
      "manufacturingStatus"
    ];

  currentStage:
    GenesisKnowledgeLifecycleRecord[
      "currentStage"
    ];
}

export interface GenesisRepositorySeedHandoffCertification {
  certificationId:
    GenesisRepositorySeedHandoffCertificationId;

  state:
    GenesisRepositorySeedHandoffState;

  repositorySeedCertificationId:
    GenesisRepositorySeedCertification[
      "certificationId"
    ];

  seedEvidenceIds:
    readonly string[];

  records:
    readonly GenesisRepositorySeedHandoffRecord[];

  summary: {
    seedEvidence:
      number;

    handedOff:
      number;

    notCorrelated:
      number;

    ambiguous:
      number;

    missing:
      number;
  };

  blockers:
    readonly string[];
}


function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          key => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}


function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


function recordFor(
  evidenceId:
    string,

  lifecycleRecords:
    readonly GenesisKnowledgeLifecycleRecord[],
): GenesisRepositorySeedHandoffRecord {
  const matches =
    lifecycleRecords.filter(
      record =>
        record.evidenceId ===
        evidenceId,
    );

  if (
    matches.length ===
      0
  ) {
    return {
      evidenceId,

      state:
        "missing",

      manufacturingRunId:
        null,

      matchingManufacturingRunIds:
        [],

      manufacturingStatus:
        null,

      currentStage:
        null,
    };
  }

  if (
    matches.length >
      1
  ) {
    throw new Error(
      "genesis_repository_seed_handoff_duplicate_lifecycle_record",
    );
  }

  const lifecycle =
    matches[0];

  if (
    lifecycle
      .manufacturingCorrelation ===
      "ambiguous"
  ) {
    return {
      evidenceId,

      state:
        "ambiguous",

      manufacturingRunId:
        lifecycle
          .manufacturingRunId,

      matchingManufacturingRunIds:
        [
          ...lifecycle
            .matchingManufacturingRunIds,
        ].sort(),

      manufacturingStatus:
        lifecycle
          .manufacturingStatus,

      currentStage:
        lifecycle.currentStage,
    };
  }

  if (
    lifecycle
      .manufacturingCorrelation ===
      "not-correlated"
  ) {
    if (
      lifecycle.manufacturingRunId !==
        null ||
      lifecycle
        .matchingManufacturingRunIds
        .length !==
        0
    ) {
      throw new Error(
        "genesis_repository_seed_handoff_uncorrelated_run_identity_mismatch",
      );
    }

    return {
      evidenceId,

      state:
        "not-correlated",

      manufacturingRunId:
        null,

      matchingManufacturingRunIds:
        [],

      manufacturingStatus:
        lifecycle
          .manufacturingStatus,

      currentStage:
        lifecycle.currentStage,
    };
  }

  if (
    !lifecycle
      .manufacturingRunId ||
    lifecycle
      .matchingManufacturingRunIds
      .length !==
      1 ||
    lifecycle
      .matchingManufacturingRunIds[0] !==
      lifecycle
        .manufacturingRunId
  ) {
    throw new Error(
      "genesis_repository_seed_handoff_correlated_run_identity_invalid",
    );
  }

  /*
   * Handoff certification stops at successful correlation to the
   * existing Knowledge manufacturing run.
   *
   * Compiler, validation, package, Canonical Review, Canonical
   * Knowledge, Organizational Memory, and educational outcomes
   * are later lifecycle concerns and do not redefine whether the
   * certified Genesis Evidence crossed the seeding boundary.
   */
  return {
    evidenceId,

    state:
      "handed-off",

    manufacturingRunId:
      lifecycle
        .manufacturingRunId,

    matchingManufacturingRunIds:
      [
        ...lifecycle
          .matchingManufacturingRunIds,
      ],

    manufacturingStatus:
      lifecycle
        .manufacturingStatus,

    currentStage:
      lifecycle.currentStage,
  };
}


export function buildGenesisRepositorySeedHandoffCertification(
  input: {
    repositorySeedCertification:
      GenesisRepositorySeedCertification;

    knowledgeLifecycle:
      GenesisKnowledgeLifecycleProjection;
  },
): GenesisRepositorySeedHandoffCertification {
  const {
    repositorySeedCertification,
    knowledgeLifecycle,
  } = input;

  const seedEvidenceIds =
    [
      ...new Set(
        repositorySeedCertification
          .seedEvidenceIds,
      ),
    ].sort();

  if (
    seedEvidenceIds.length !==
    repositorySeedCertification
      .seedEvidenceIds
      .length
  ) {
    throw new Error(
      "genesis_repository_seed_handoff_duplicate_seed_evidence",
    );
  }

  const records =
    seedEvidenceIds.map(
      evidenceId =>
        recordFor(
          evidenceId,
          knowledgeLifecycle.records,
        ),
    );

  const summary = {
    seedEvidence:
      records.length,

    handedOff:
      records.filter(
        record =>
          record.state ===
          "handed-off",
      ).length,

    notCorrelated:
      records.filter(
        record =>
          record.state ===
          "not-correlated",
      ).length,

    ambiguous:
      records.filter(
        record =>
          record.state ===
          "ambiguous",
      ).length,

    missing:
      records.filter(
        record =>
          record.state ===
          "missing",
      ).length,
  };

  const blockers:
    string[] =
      [];

  if (
    repositorySeedCertification
      .repositorySeedCorpus !==
      "CERTIFIED"
  ) {
    blockers.push(
      "repository-seed-corpus-not-certified",
    );
  }

  if (
    summary.missing >
      0
  ) {
    blockers.push(
      "seed-lifecycle-record-missing",
    );
  }

  if (
    summary.notCorrelated >
      0
  ) {
    blockers.push(
      "seed-manufacturing-not-correlated",
    );
  }

  if (
    summary.ambiguous >
      0
  ) {
    blockers.push(
      "seed-manufacturing-correlation-ambiguous",
    );
  }

  const state:
    GenesisRepositorySeedHandoffState =
      repositorySeedCertification
        .repositorySeedCorpus ===
        "BLOCKED" ||
      summary.ambiguous >
        0
        ? "BLOCKED"
        : blockers.length >
            0
          ? "INCOMPLETE"
          : "CERTIFIED";

  const certificationId =
    `genesis-repository-seed-handoff:${hash({
      repositorySeedCertificationId:
        repositorySeedCertification
          .certificationId,

      seedEvidenceIds,

      records,

      summary,

      blockers:
        [...blockers].sort(),

      state,
    })}` as GenesisRepositorySeedHandoffCertificationId;

  return {
    certificationId,

    state,

    repositorySeedCertificationId:
      repositorySeedCertification
        .certificationId,

    seedEvidenceIds,

    records,

    summary,

    blockers:
      [...blockers].sort(),
  };
}
