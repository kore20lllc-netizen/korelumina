import {
  createHash,
} from "node:crypto";

import type {
  GenesisReplayCheckpointDisposition,
} from "./GenesisReplayCheckpoint.js";

import {
  classifyGenesisHistoricalAdmission,
} from "./GenesisHistoricalAdmissionGovernancePolicy.js";

import type {
  GenesisHistoricalAdmissionClassification,
} from "./GenesisHistoricalAdmissionGovernancePolicy.js";

import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

export type GenesisHistoricalAdmissionGovernanceProjectionId =
  `genesis-historical-admission-governance:${string}`;

export interface GenesisHistoricalAdmissionGovernanceRecord {
  historicalSourceId:
    string;

  evidenceId:
    string;

  classification:
    GenesisHistoricalAdmissionClassification;

  correlationEligible:
    boolean;

  knowledgeManufacturingAuthorized:
    boolean;

  reasons:
    readonly string[];
}

export interface GenesisHistoricalAdmissionGovernanceSummary {
  admittedEvidence:
    number;

  historicalEvidenceOnly:
    number;

  historicalCorrelationEligible:
    number;

  knowledgeSeedingEligible:
    number;

  requiresGovernanceReview:
    number;

  knowledgeManufacturingAuthorized:
    number;
}

export interface GenesisHistoricalAdmissionGovernanceProjection {
  projectionId:
    GenesisHistoricalAdmissionGovernanceProjectionId;

  records:
    readonly GenesisHistoricalAdmissionGovernanceRecord[];

  summary:
    GenesisHistoricalAdmissionGovernanceSummary;
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

export function buildGenesisHistoricalAdmissionGovernanceProjection(
  input: {
    manifestEntries:
      readonly GenesisSourceManifestEntry[];

    dispositions:
      readonly GenesisReplayCheckpointDisposition[];
  },
): GenesisHistoricalAdmissionGovernanceProjection {
  const manifestByHistoricalSourceId =
    new Map<
      string,
      GenesisSourceManifestEntry
    >();

  for (
    const entry
    of input.manifestEntries
  ) {
    if (
      manifestByHistoricalSourceId.has(
        entry.historicalSourceId,
      )
    ) {
      throw new Error(
        "genesis_historical_admission_governance_projection_duplicate_manifest_source",
      );
    }

    manifestByHistoricalSourceId.set(
      entry.historicalSourceId,
      entry,
    );
  }

  const records =
    input.dispositions
      .filter(
        disposition =>
          disposition.disposition ===
            "ADMITTED" &&
          Boolean(
            disposition.evidenceId,
          ),
      )
      .map(
        disposition => {
          const source =
            manifestByHistoricalSourceId.get(
              disposition.historicalSourceId,
            );

          if (
            !source
          ) {
            throw new Error(
              "genesis_historical_admission_governance_projection_manifest_source_missing",
            );
          }

          const governance =
            classifyGenesisHistoricalAdmission(
              source,
            );

          return {
            historicalSourceId:
              disposition.historicalSourceId,

            evidenceId:
              disposition.evidenceId!,

            classification:
              governance.classification,

            correlationEligible:
              governance.correlationEligible,

            knowledgeManufacturingAuthorized:
              governance.invokeKnowledgeManufacturing,

            reasons:
              [
                ...governance.reasons,
              ],
          } satisfies GenesisHistoricalAdmissionGovernanceRecord;
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.historicalSourceId.localeCompare(
            right.historicalSourceId,
          ) ||
          left.evidenceId.localeCompare(
            right.evidenceId,
          ),
      );

  const summary:
    GenesisHistoricalAdmissionGovernanceSummary = {
      admittedEvidence:
        records.length,

      historicalEvidenceOnly:
        records.filter(
          record =>
            record.classification ===
            "historical-evidence-only",
        ).length,

      historicalCorrelationEligible:
        records.filter(
          record =>
            record.classification ===
            "historical-correlation-eligible",
        ).length,

      knowledgeSeedingEligible:
        records.filter(
          record =>
            record.classification ===
            "knowledge-seeding-eligible",
        ).length,

      requiresGovernanceReview:
        records.filter(
          record =>
            record.classification ===
            "requires-governance-review",
        ).length,

      knowledgeManufacturingAuthorized:
        records.filter(
          record =>
            record.knowledgeManufacturingAuthorized,
        ).length,
    };

  const projectionId =
    `genesis-historical-admission-governance:${hash({
      records,
      summary,
    })}` as GenesisHistoricalAdmissionGovernanceProjectionId;

  return {
    projectionId,
    records,
    summary,
  };
}
