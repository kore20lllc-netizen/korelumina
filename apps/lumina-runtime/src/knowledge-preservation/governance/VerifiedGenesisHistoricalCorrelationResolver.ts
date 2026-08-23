import type {
  GenesisHistoricalCorrelationState,
  GenesisReplayExecution,
  GenesisReplayId,
} from "../genesis/index.js";

import {
  createGenesisReplayAdmissionIdentity,
  createGenesisSyntheticEvidenceId,
  createHistoricalSourceId,
  FileGenesisHistoricalCorrelationPersistenceStore,
  FileGenesisReplayPersistenceStore,
  listGenesisReplayInventory,
} from "../genesis/index.js";

import {
  KnowledgePackageService,
} from "../package/index.js";

import {
  hasDurableIncompleteGovernanceIdentityException,
} from "./GovernanceExceptionClassificationService.js";

import type {
  VerifiedGenesisHistoricalCorrelationProof,
} from "./LegacyHistoricalReconciliationService.js";


export interface GenesisHistoricalReplayReader {
  listReplayIds():
    readonly GenesisReplayId[];

  loadExecution(
    replayId:
      GenesisReplayId,
  ):
    GenesisReplayExecution |
    null;
}

export interface GenesisHistoricalCorrelationReader {
  load(
    replayId:
      GenesisReplayId,
  ):
    GenesisHistoricalCorrelationState |
    null;
}

class PersistedGenesisHistoricalReplayReader
  implements GenesisHistoricalReplayReader
{
  private readonly persistence =
    new FileGenesisReplayPersistenceStore();

  listReplayIds():
    readonly GenesisReplayId[] {
    return listGenesisReplayInventory({
      persistence:
        this.persistence,
    }).replayIds;
  }

  loadExecution(
    replayId:
      GenesisReplayId,
  ):
    GenesisReplayExecution |
    null {
    return this.persistence
      .loadExecution(
        replayId,
      );
  }
}

class PersistedGenesisHistoricalCorrelationReader
  implements GenesisHistoricalCorrelationReader
{
  private readonly persistence =
    new FileGenesisHistoricalCorrelationPersistenceStore();

  load(
    replayId:
      GenesisReplayId,
  ):
    GenesisHistoricalCorrelationState |
    null {
    return this.persistence
      .load(
        replayId,
      );
  }
}

interface ReplayEvidenceMatch {
  replayId:
    GenesisReplayId;

  execution:
    GenesisReplayExecution;

  historicalSourceId:
    string;
}

function required(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `verified_genesis_historical_correlation_${field}_required`,
    );
  }

  return normalized;
}

function exactlyOne<T>(
  values:
    readonly T[],

  missingError:
    string,

  ambiguousError:
    string,
): T {
  if (
    values.length ===
      0
  ) {
    throw new Error(
      missingError,
    );
  }

  if (
    values.length !==
      1
  ) {
    throw new Error(
      ambiguousError,
    );
  }

  return values[0];
}


export class VerifiedGenesisHistoricalCorrelationResolver {
  constructor(
    private readonly packageService:
      KnowledgePackageService =
        new KnowledgePackageService(),

    private readonly replayReader:
      GenesisHistoricalReplayReader =
        new PersistedGenesisHistoricalReplayReader(),

    private readonly correlationReader:
      GenesisHistoricalCorrelationReader =
        new PersistedGenesisHistoricalCorrelationReader(),
  ) {}

  resolveForPackage(
    packageIdInput:
      string,
  ):
    VerifiedGenesisHistoricalCorrelationProof {
    const packageId =
      required(
        packageIdInput,
        "package_id",
      );

    const knowledgePackage =
      this.packageService
        .get(
          packageId,
        );

    if (
      !knowledgePackage
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_package_not_found",
      );
    }

    if (
      !hasDurableIncompleteGovernanceIdentityException(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_governance_exception_required",
      );
    }

    if (
      knowledgePackage
        .sourceEvidenceRefs
        .length !==
        1
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_single_evidence_required",
      );
    }

    const evidenceId =
      required(
        knowledgePackage
          .sourceEvidenceRefs[0],
        "evidence_id",
      );

    if (
      !evidenceId.startsWith(
        "genesis-evidence:",
      )
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_genesis_evidence_required",
      );
    }

    const replayMatches:
      ReplayEvidenceMatch[] =
      [];

    for (
      const replayId
      of this.replayReader
        .listReplayIds()
    ) {
      const execution =
        this.replayReader
          .loadExecution(
            replayId,
          );

      if (
        !execution
      ) {
        continue;
      }

      const dispositions =
        execution
          .state
          .dispositions
          .filter(
            (
              disposition,
            ) =>
              disposition
                .disposition ===
                "ADMITTED" &&
              disposition
                .evidenceId ===
                evidenceId,
          );

      if (
        dispositions.length >
          1
      ) {
        throw new Error(
          "verified_genesis_historical_correlation_replay_disposition_ambiguous",
        );
      }

      if (
        dispositions.length ===
        1
      ) {
        replayMatches.push({
          replayId,

          execution,

          historicalSourceId:
            dispositions[0]
              .historicalSourceId,
        });
      }
    }

    if (
      replayMatches.length ===
        0
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_replay_disposition_not_found",
      );
    }

    /*
     * Genesis synthetic Evidence identity is replay-independent.
     * The same historical source may therefore be ADMITTED by
     * multiple replay executions without representing multiple
     * historical facts.
     *
     * Collapse repeated occurrences only when every persisted
     * occurrence proves the same source identity, checksum,
     * provenance locator, evidence type, and source type.
     * Any disagreement remains a fail-closed ambiguity.
     */
    const replayProofs =
      replayMatches.map(
        (
          match,
        ) => {
          const manifestMatches =
            match
              .execution
              .manifest
              .entries
              .map(
                (
                  manifestEntry,
                  manifestIndex,
                ) => ({
                  manifestEntry,
                  manifestIndex,
                }),
              )
              .filter(
                (
                  candidate,
                ) =>
                  candidate
                    .manifestEntry
                    .historicalSourceId ===
                    match.historicalSourceId,
              );

          const {
            manifestEntry,
            manifestIndex,
          } =
            exactlyOne(
              manifestMatches,
              "verified_genesis_historical_correlation_manifest_entry_not_found",
              "verified_genesis_historical_correlation_manifest_entry_ambiguous",
            );

          const planEntry =
            match
              .execution
              .plan
              .entries[
                manifestIndex
              ];

          if (
            !planEntry ||
            planEntry
              .historicalSourceId !==
              match.historicalSourceId ||
            planEntry.action !==
              "ADMIT" ||
            planEntry
              .sourceChecksum !==
              manifestEntry
                .sourceChecksum
          ) {
            throw new Error(
              "verified_genesis_historical_correlation_plan_manifest_mismatch",
            );
          }

          if (
            manifestEntry
              .sourceType !==
              "commit" ||
            manifestEntry
              .evidenceType !==
              "commit"
          ) {
            throw new Error(
              "verified_genesis_historical_correlation_commit_source_required",
            );
          }

          const admissionIdentity =
            createGenesisReplayAdmissionIdentity({
              replayId:
                match.replayId,

              manifestId:
                match
                  .execution
                  .manifest
                  .manifestId,

              repository:
                match
                  .execution
                  .manifest
                  .scope
                  .repository,

              manifestIndex,

              planEntry,

              manifestEntry,
            });

          if (
            createGenesisSyntheticEvidenceId(
              admissionIdentity,
            ) !==
            evidenceId
          ) {
            throw new Error(
              "verified_genesis_historical_correlation_evidence_identity_mismatch",
            );
          }

          return {
            ...match,

            signature:
              JSON.stringify({
                historicalSourceId:
                  match.historicalSourceId,

                sourceChecksum:
                  manifestEntry
                    .sourceChecksum,

                provenanceLocator:
                  manifestEntry
                    .provenanceLocator,

                sourceType:
                  manifestEntry
                    .sourceType,

                evidenceType:
                  manifestEntry
                    .evidenceType,
              }),
          };
        },
      );

    const proofSignatures =
      new Set(
        replayProofs.map(
          (
            match,
          ) =>
            match.signature,
        ),
      );

    if (
      proofSignatures.size !==
        1
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_replay_ambiguous",
      );
    }

    /*
     * Replay occurrence identity is not part of the historical
     * fact. Select deterministically so reconciliation metadata
     * remains stable across reruns and process restarts.
     */
    const replayMatch =
      [...replayProofs]
        .sort(
          (
            left,
            right,
          ) =>
            left.replayId
              .localeCompare(
                right.replayId,
              ),
        )[0];

    const {
      replayId,
      execution,
      historicalSourceId,
    } =
      replayMatch;

    const manifestMatches =
      execution
        .manifest
        .entries
        .map(
          (
            manifestEntry,
            manifestIndex,
          ) => ({
            manifestEntry,
            manifestIndex,
          }),
        )
        .filter(
          (
            candidate,
          ) =>
            candidate
              .manifestEntry
              .historicalSourceId ===
              historicalSourceId,
        );

    const {
      manifestEntry,
      manifestIndex,
    } =
      exactlyOne(
        manifestMatches,
        "verified_genesis_historical_correlation_manifest_entry_not_found",
        "verified_genesis_historical_correlation_manifest_entry_ambiguous",
      );

    const planEntry =
      execution
        .plan
        .entries[
          manifestIndex
        ];

    if (
      !planEntry ||
      planEntry
        .historicalSourceId !==
        historicalSourceId ||
      planEntry.action !==
        "ADMIT" ||
      planEntry
        .sourceChecksum !==
        manifestEntry
          .sourceChecksum
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_plan_manifest_mismatch",
      );
    }

    if (
      manifestEntry
        .sourceType !==
        "commit" ||
      manifestEntry
        .evidenceType !==
        "commit"
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_commit_source_required",
      );
    }

    const sourceChecksum =
      required(
        manifestEntry
          .sourceChecksum,
        "source_checksum",
      );

    if (
      !sourceChecksum.startsWith(
        "sha256:",
      )
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_source_checksum_invalid",
      );
    }

    const provenanceLocator =
      required(
        manifestEntry
          .provenanceLocator,
        "provenance_locator",
      );

    const commitLocatorPrefix =
      "git:commit:";

    if (
      !provenanceLocator.startsWith(
        commitLocatorPrefix,
      )
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_commit_locator_required",
      );
    }

    const commitSha =
      required(
        provenanceLocator.slice(
          commitLocatorPrefix
            .length,
        ),
        "commit_sha",
      );

    const expectedHistoricalSourceId =
      createHistoricalSourceId(
        "commit",
        commitSha,
      );

    if (
      expectedHistoricalSourceId !==
        historicalSourceId
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_historical_source_identity_mismatch",
      );
    }

    const admissionIdentity =
      createGenesisReplayAdmissionIdentity({
        replayId,

        manifestId:
          execution
            .manifest
            .manifestId,

        repository:
          execution
            .manifest
            .scope
            .repository,

        manifestIndex,

        planEntry,

        manifestEntry,
      });

    const expectedEvidenceId =
      createGenesisSyntheticEvidenceId(
        admissionIdentity,
      );

    if (
      expectedEvidenceId !==
        evidenceId
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_evidence_identity_mismatch",
      );
    }

    const correlation =
      this.correlationReader
        .load(
          replayId,
        );

    if (
      !correlation
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_state_not_found",
      );
    }

    const source =
      exactlyOne(
        correlation
          .sourceReferences
          .filter(
            (
              candidate,
            ) =>
              candidate
                .metadata[
                  "historicalSourceId"
                ] ===
                historicalSourceId,
          ),
        "verified_genesis_historical_correlation_source_reference_not_found",
        "verified_genesis_historical_correlation_source_reference_ambiguous",
      );

    if (
      source.sourceClass !==
        "commit" ||
      source.evidenceType !==
        "commit"
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_source_reference_type_mismatch",
      );
    }

    if (
      source.sourceRevision !==
        sourceChecksum ||
      source
        .integrity
        .checksum !==
        sourceChecksum ||
      source
        .provenance
        .locator !==
        provenanceLocator
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_source_integrity_mismatch",
      );
    }

    if (
      source
        .integrity
        .acquisitionState !==
        "acquired" &&
      source
        .integrity
        .acquisitionState !==
        "available"
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_source_not_acquired",
      );
    }

    const event =
      exactlyOne(
        correlation
          .events
          .filter(
            (
              candidate,
            ) =>
              candidate
                .observationKey ===
                historicalSourceId,
          ),
        "verified_genesis_historical_correlation_event_not_found",
        "verified_genesis_historical_correlation_event_ambiguous",
      );

    if (
      event.kind !==
        "implementation-committed"
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_event_kind_mismatch",
      );
    }

    if (
      !event
        .sourceReferenceIds
        .includes(
          source
            .sourceReferenceId,
        ) ||
      !event
        .sourceRevisionIds
        .includes(
          source
            .sourceRevisionId,
        )
    ) {
      throw new Error(
        "verified_genesis_historical_correlation_event_source_mismatch",
      );
    }

    return {
      replayId,

      evidenceId,

      historicalSourceId,

      sourceReferenceId:
        source
          .sourceReferenceId,

      sourceRevisionId:
        source
          .sourceRevisionId,

      eventId:
        event.eventId,

      eventKind:
        "implementation-committed",

      sourceChecksum,
    };
  }
}
