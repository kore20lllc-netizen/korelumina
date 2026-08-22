import {
  createHash,
} from "node:crypto";

import type {
  EvidenceItem,
} from "../evidence/index.js";

import {
  assertValidEvidenceItem,
} from "../evidence/index.js";

import type {
  GenesisReplayAdmissionAdapter,
  GenesisReplayAdmissionRequest,
  GenesisReplayAdmissionResult,
} from "./GenesisReplayExecution.js";

export type GenesisReplayAdmissionIdentity =
  `genesis-admission:${string}`;

export type GenesisSyntheticEvidenceId =
  `genesis-evidence:${string}`;

function sha256Identity(
  prefix:
    "genesis-admission" |
    "genesis-evidence",

  canonical:
    unknown,
): string {
  const digest =
    createHash(
      "sha256",
    )
      .update(
        JSON.stringify(
          canonical,
        ),
        "utf8",
      )
      .digest(
        "hex",
      );

  return `${prefix}:${digest}`;
}

export function createGenesisReplayAdmissionIdentity(
  request:
    Pick<
      GenesisReplayAdmissionRequest,
      | "replayId"
      | "manifestId"
      | "repository"
      | "manifestIndex"
      | "planEntry"
      | "manifestEntry"
    >,
): GenesisReplayAdmissionIdentity {
  const canonical = {
    repository:
      request.repository,

    historicalSourceId:
      request.planEntry
        .historicalSourceId,

    sourceChecksum:
      request.planEntry
        .sourceChecksum,

    evidenceType:
      request.manifestEntry
        .evidenceType,

    provenanceLocator:
      request.manifestEntry
        .provenanceLocator,
  };

  return sha256Identity(
    "genesis-admission",
    canonical,
  ) as GenesisReplayAdmissionIdentity;
}

export function createGenesisSyntheticEvidenceId(
  admissionIdentity:
    GenesisReplayAdmissionIdentity,
): GenesisSyntheticEvidenceId {
  return sha256Identity(
    "genesis-evidence",
    {
      admissionIdentity,
    },
  ) as GenesisSyntheticEvidenceId;
}

export interface GenesisReplayAdmissionOccurrence {
  replayId:
    GenesisReplayAdmissionRequest[
      "replayId"
    ];

  manifestId:
    string;

  manifestIndex:
    number;

  executionTimestamp:
    number;
}

export interface GenesisSyntheticEvidenceRecord {
  admissionIdentity:
    GenesisReplayAdmissionIdentity;

  evidence:
    EvidenceItem;

  occurrences:
    readonly GenesisReplayAdmissionOccurrence[];
}

function titleFor(
  request:
    GenesisReplayAdmissionRequest,
): string {
  const title =
    request.manifestEntry
      .metadata.title;

  if (
    typeof title ===
      "string" &&
    title.trim()
  ) {
    return title.trim();
  }

  const subject =
    request.manifestEntry
      .metadata.subject;

  if (
    typeof subject ===
      "string" &&
    subject.trim()
  ) {
    return subject.trim();
  }

  return (
    `${request.manifestEntry.evidenceType}: ` +
    request.planEntry
      .historicalSourceId
  );
}

export function genesisAdmissionRequestToSyntheticEvidence(
  request:
    GenesisReplayAdmissionRequest,
): GenesisSyntheticEvidenceRecord {
  const admissionIdentity =
    request.admissionIdentity;

  const expectedIdentity =
    createGenesisReplayAdmissionIdentity(
      request,
    );

  if (
    admissionIdentity !==
    expectedIdentity
  ) {
    throw new Error(
      "genesis_replay_admission_identity_mismatch",
    );
  }

  const evidenceId =
    createGenesisSyntheticEvidenceId(
      admissionIdentity,
    );

  const capturedAt =
    request.executionTimestamp;

  const observedAt =
    request.manifestEntry
      .historicalTimestamp;

  if (
    capturedAt <
    observedAt
  ) {
    throw new Error(
      "genesis_replay_admission_capture_precedes_observation",
    );
  }

  const evidence:
    EvidenceItem =
      {
        id:
          evidenceId,

        type:
          request.manifestEntry
            .evidenceType,

        title:
          titleFor(
            request,
          ),

        source:
          "genesis-historical-replay",

        capturedAt,

        observedAt,

        contentRef:
          request.manifestEntry
            .provenanceLocator,

        checksum:
          request.manifestEntry
            .sourceChecksum,

        metadata: {
          genesisRepository:
            request.repository,

          genesisReplayId:
            request.replayId,

          genesisManifestId:
            request.manifestId,

          genesisManifestIndex:
            request.manifestIndex,

          genesisAdmissionIdentity:
            admissionIdentity,

          historicalSourceId:
            request.planEntry
              .historicalSourceId,

          historicalTimestampSource:
            request.manifestEntry
              .historicalTimestampSource,

          authorityClass:
            request.manifestEntry
              .authorityClass,

          approvalState:
            request.manifestEntry
              .approvalState,

          owner:
            request.manifestEntry
              .authorityOwner,

          scope:
            request.manifestEntry
              .authorityScope,

          version:
            request.manifestEntry
              .authorityVersion,

          effectiveFrom:
            request.manifestEntry
              .effectiveFrom,

          effectiveTo:
            request.manifestEntry
              .effectiveTo,

          sourceLocation:
            typeof request
              .manifestEntry
              .metadata
              .sourceLocation ===
              "string"
              ? request
                  .manifestEntry
                  .metadata
                  .sourceLocation
              : request
                  .manifestEntry
                  .provenanceLocator,

          documentClassification:
            request.manifestEntry
              .metadata
              .documentClassification,

          discoveryMethod:
            request.manifestEntry
              .discoveryMethod,

          sourceMetadata:
            request.manifestEntry
              .metadata,
        },

        relationships: {
          genesisHistoricalSource: [
            request.planEntry
              .historicalSourceId,
          ],

          genesisReplay: [
            request.replayId,
          ],

          genesisManifest: [
            request.manifestId,
          ],
        },
      };

  assertValidEvidenceItem(
    evidence,
  );

  return {
    admissionIdentity,

    evidence,

    occurrences: [
      {
        replayId:
          request.replayId,

        manifestId:
          request.manifestId,

        manifestIndex:
          request.manifestIndex,

        executionTimestamp:
          request.executionTimestamp,
      },
    ],
  };
}

export function genesisReplayAdmissionRequestToEvidence(
  request:
    GenesisReplayAdmissionRequest,
): EvidenceItem {
  return genesisAdmissionRequestToSyntheticEvidence(
    request,
  ).evidence;
}

export class GenesisSyntheticReplayAdmissionAdapter
  implements GenesisReplayAdmissionAdapter
{
  private readonly recordsByAdmissionIdentity =
    new Map<
      GenesisReplayAdmissionIdentity,
      GenesisSyntheticEvidenceRecord
    >();

  async admit(
    request:
      GenesisReplayAdmissionRequest,
  ): Promise<
    GenesisReplayAdmissionResult
  > {
    const record =
      genesisAdmissionRequestToSyntheticEvidence(
        request,
      );

    const existing =
      this.recordsByAdmissionIdentity.get(
        record.admissionIdentity,
      );

    if (
      existing
    ) {
      if (
        existing.evidence.id !==
        record.evidence.id ||
        existing.evidence.checksum !==
        record.evidence.checksum
      ) {
        throw new Error(
          "genesis_replay_admission_idempotency_conflict",
        );
      }

      const occurrence =
        record.occurrences[0];

      const alreadyRecorded =
        existing.occurrences.some(
          (
            existingOccurrence,
          ) =>
            existingOccurrence.replayId ===
              occurrence.replayId &&
            existingOccurrence.manifestId ===
              occurrence.manifestId &&
            existingOccurrence.manifestIndex ===
              occurrence.manifestIndex,
        );

      if (
        !alreadyRecorded
      ) {
        this.recordsByAdmissionIdentity.set(
          record.admissionIdentity,
          {
            ...existing,

            occurrences: [
              ...existing.occurrences,
              occurrence,
            ],
          },
        );
      }

      return {
        evidenceId:
          existing.evidence.id,
      };
    }

    this.recordsByAdmissionIdentity.set(
      record.admissionIdentity,
      record,
    );

    return {
      evidenceId:
        record.evidence.id,
    };
  }

  listRecords():
    readonly GenesisSyntheticEvidenceRecord[] {
    return [
      ...this
        .recordsByAdmissionIdentity
        .values(),
    ];
  }
}
