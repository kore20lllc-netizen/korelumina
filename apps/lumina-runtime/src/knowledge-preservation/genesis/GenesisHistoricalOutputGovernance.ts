import {
  createHash,
} from "node:crypto";

import type {
  GenesisHistoricalAdmissionClassification,
} from "./GenesisHistoricalAdmissionGovernancePolicy.js";

import type {
  GenesisHistoricalAdmissionGovernanceProjection,
} from "./GenesisHistoricalAdmissionGovernanceProjection.js";

import type {
  GenesisKnowledgeLifecycleProjection,
} from "./GenesisKnowledgeLifecycleCorrelation.js";


export type GenesisHistoricalOutputGovernanceProjectionId =
  `genesis-historical-output-governance:${string}`;

export type GenesisHistoricalOutputCurrentPolicyStatus =
  | "current-policy-authorized"
  | "historical-output-not-currently-authorized"
  | "current-governance-unavailable";


export interface GenesisHistoricalOutputGovernanceRecord {
  evidenceId:
    string;

  packageId:
    string | null;

  canonicalKnowledgeIds:
    readonly string[];

  organizationalMemoryRecordIds:
    readonly string[];

  currentClassification:
    GenesisHistoricalAdmissionClassification |
    null;

  currentKnowledgeManufacturingAuthorized:
    boolean | null;

  currentPolicyStatus:
    GenesisHistoricalOutputCurrentPolicyStatus;

  historicalOutputPreserved:
    true;

  reasons:
    readonly string[];
}


export interface GenesisHistoricalOutputGovernanceSummary {
  historicalOutputs:
    number;

  currentPolicyAuthorized:
    number;

  historicalOutputsNotCurrentlyAuthorized:
    number;

  currentGovernanceUnavailable:
    number;

  packagedHistoricalOutputs:
    number;

  canonicalHistoricalOutputs:
    number;

  memoryCorrelatedHistoricalOutputs:
    number;
}


export interface GenesisHistoricalOutputGovernanceProjection {
  projectionId:
    GenesisHistoricalOutputGovernanceProjectionId;

  records:
    readonly GenesisHistoricalOutputGovernanceRecord[];

  summary:
    GenesisHistoricalOutputGovernanceSummary;
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


function memoryRecordIds(
  record:
    GenesisKnowledgeLifecycleProjection[
      "records"
    ][number],
): readonly string[] {
  return [
    ...new Set(
      record
        .organizationalMemory
        .flatMap(
          correlation =>
            correlation
              .memoryRecordIds,
        ),
    ),
  ].sort();
}


function hasHistoricalOutput(
  record:
    GenesisKnowledgeLifecycleProjection[
      "records"
    ][number],
): boolean {
  return (
    record.manufacturingCorrelation ===
      "correlated" ||
    record.packageId !==
      null ||
    record.canonicalKnowledgeIds
      .length >
      0 ||
    record.organizationalMemory
      .some(
        correlation =>
          correlation
            .memoryRecordIds
            .length >
          0,
      )
  );
}


export function buildGenesisHistoricalOutputGovernanceProjection(
  input: {
    historicalAdmissionGovernance:
      GenesisHistoricalAdmissionGovernanceProjection;

    knowledgeLifecycle:
      GenesisKnowledgeLifecycleProjection;
  },
): GenesisHistoricalOutputGovernanceProjection {
  const governanceByEvidence =
    new Map(
      input
        .historicalAdmissionGovernance
        .records
        .map(
          record => [
            record.evidenceId,
            record,
          ],
        ),
    );

  const records:
    GenesisHistoricalOutputGovernanceRecord[] =
      input
        .knowledgeLifecycle
        .records
        .filter(
          hasHistoricalOutput,
        )
        .map(
          lifecycle => {
            const governance =
              governanceByEvidence.get(
                lifecycle.evidenceId,
              );

            const currentPolicyStatus:
              GenesisHistoricalOutputCurrentPolicyStatus =
                !governance
                  ? "current-governance-unavailable"
                  : governance
                      .knowledgeManufacturingAuthorized
                    ? "current-policy-authorized"
                    : "historical-output-not-currently-authorized";

            return {
              evidenceId:
                lifecycle.evidenceId,

              packageId:
                lifecycle.packageId,

              canonicalKnowledgeIds:
                [
                  ...lifecycle
                    .canonicalKnowledgeIds,
                ],

              organizationalMemoryRecordIds:
                memoryRecordIds(
                  lifecycle,
                ),

              currentClassification:
                governance
                  ?.classification ??
                null,

              currentKnowledgeManufacturingAuthorized:
                governance
                  ?.knowledgeManufacturingAuthorized ??
                null,

              currentPolicyStatus,

              historicalOutputPreserved:
                true as const,

              reasons:
                governance
                  ? [
                      ...governance
                        .reasons,
                    ]
                  : [
                      "No current Genesis admission-governance record is available for this historical output.",
                    ],
            };
          },
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.evidenceId
              .localeCompare(
                right.evidenceId,
              ),
        );

  const summary:
    GenesisHistoricalOutputGovernanceSummary = {
      historicalOutputs:
        records.length,

      currentPolicyAuthorized:
        records.filter(
          record =>
            record.currentPolicyStatus ===
            "current-policy-authorized",
        ).length,

      historicalOutputsNotCurrentlyAuthorized:
        records.filter(
          record =>
            record.currentPolicyStatus ===
            "historical-output-not-currently-authorized",
        ).length,

      currentGovernanceUnavailable:
        records.filter(
          record =>
            record.currentPolicyStatus ===
            "current-governance-unavailable",
        ).length,

      packagedHistoricalOutputs:
        records.filter(
          record =>
            record.packageId !==
            null,
        ).length,

      canonicalHistoricalOutputs:
        records.filter(
          record =>
            record.canonicalKnowledgeIds
              .length >
            0,
        ).length,

      memoryCorrelatedHistoricalOutputs:
        records.filter(
          record =>
            record
              .organizationalMemoryRecordIds
              .length >
            0,
        ).length,
    };

  const projectionId =
    `genesis-historical-output-governance:${hash({
      records,
      summary,
    })}` as
      GenesisHistoricalOutputGovernanceProjectionId;

  return {
    projectionId,
    records,
    summary,
  };
}
