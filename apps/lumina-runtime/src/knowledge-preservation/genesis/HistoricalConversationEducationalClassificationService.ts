import type {
  EvidenceItem,
} from "../evidence/EvidenceItem.js";

import {
  FileEvidencePersistenceStore,
  type EvidencePersistenceStore,
} from "../evidence/EvidencePersistenceStore.js";

import {
  createHistoricalConversationEducationalClassification,
  type HistoricalConversationEducationalClassification,
  type HistoricalConversationEducationalRequirementContribution,
} from "./HistoricalConversationEducationalClassification.js";

import {
  HistoricalConversationEducationalClassificationPersistence,
} from "./HistoricalConversationEducationalClassificationPersistence.js";


export interface HistoricalConversationEducationalClassificationServiceOptions {
  persistence:
    HistoricalConversationEducationalClassificationPersistence;

  evidencePersistenceStore?:
    EvidencePersistenceStore;
}


export interface CreateGovernedHistoricalConversationEducationalClassificationInput {
  conversationId:
    string;

  correlationId:
    string;

  requirementContributions:
    HistoricalConversationEducationalRequirementContribution[];

  createdAt:
    number;
}


function requireNonEmpty(
  value:
    string,
  reason:
    string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      reason,
    );
  }

  return normalized;
}


function conversationIdFromEvidence(
  evidence:
    EvidenceItem,
): string {
  const value =
    evidence.metadata.conversationId;

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      "historical_conversation_educational_classification_evidence_conversation_id_missing",
    );
  }

  return value.trim();
}


function conversationChecksumFromEvidence(
  evidence:
    EvidenceItem,
): string {
  const value =
    evidence.metadata.conversationChecksum;

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      "historical_conversation_educational_classification_evidence_conversation_checksum_missing",
    );
  }

  return value.trim();
}


export class HistoricalConversationEducationalClassificationService {
  private readonly persistence:
    HistoricalConversationEducationalClassificationPersistence;

  private readonly evidencePersistenceStore:
    EvidencePersistenceStore;


  public constructor(
    options:
      HistoricalConversationEducationalClassificationServiceOptions,
  ) {
    this.persistence =
      options.persistence;

    this.evidencePersistenceStore =
      options.evidencePersistenceStore ??
      new FileEvidencePersistenceStore();
  }


  public async create(
    input:
      CreateGovernedHistoricalConversationEducationalClassificationInput,
  ): Promise<HistoricalConversationEducationalClassification> {
    const conversationId =
      requireNonEmpty(
        input.conversationId,
        "historical_conversation_educational_classification_service_conversation_id_required",
      );

    const correlationId =
      requireNonEmpty(
        input.correlationId,
        "historical_conversation_educational_classification_service_correlation_id_required",
      );

    const contributionEvidenceIds =
      [
        ...new Set(
          input.requirementContributions.flatMap(
            (
              contribution,
            ) =>
              contribution.evidenceIds.map(
                (
                  evidenceId,
                ) =>
                  evidenceId.trim(),
              ),
          ),
        ),
      ]
        .filter(
          Boolean,
        )
        .sort();

    if (
      contributionEvidenceIds.length ===
      0
    ) {
      throw new Error(
        "historical_conversation_educational_classification_service_evidence_required",
      );
    }

    const evidenceItems =
      contributionEvidenceIds.map(
        (
          evidenceId,
        ) => {
          const evidence =
            this.evidencePersistenceStore.load(
              evidenceId,
            );

          if (
            !evidence
          ) {
            throw new Error(
              `historical_conversation_educational_classification_service_evidence_missing:${evidenceId}`,
            );
          }

          return evidence;
        },
      );

    const conversationChecksums =
      new Set<string>();

    for (
      const evidence
      of evidenceItems
    ) {
      if (
        evidence.type !==
        "conversation"
      ) {
        throw new Error(
          `historical_conversation_educational_classification_service_evidence_not_conversation:${evidence.id}`,
        );
      }

      const evidenceConversationId =
        conversationIdFromEvidence(
          evidence,
        );

      if (
        evidenceConversationId !==
        conversationId
      ) {
        throw new Error(
          `historical_conversation_educational_classification_service_conversation_mismatch:${evidence.id}`,
        );
      }

      conversationChecksums.add(
        conversationChecksumFromEvidence(
          evidence,
        ),
      );
    }

    if (
      conversationChecksums.size !==
      1
    ) {
      throw new Error(
        "historical_conversation_educational_classification_service_conversation_checksum_mismatch",
      );
    }

    const sourceChecksum =
      [...conversationChecksums][0];

    if (
      !sourceChecksum
    ) {
      throw new Error(
        "historical_conversation_educational_classification_service_source_checksum_missing",
      );
    }

    const classification =
      createHistoricalConversationEducationalClassification({
        conversationId,
        correlationId,

        sourceEvidenceIds:
          contributionEvidenceIds,

        sourceChecksum,

        requirementContributions:
          input.requirementContributions,

        createdAt:
          input.createdAt,
      });

    return this.persistence.save(
      classification,
    );
  }


  public async read(
    classificationId:
      string,
  ): Promise<HistoricalConversationEducationalClassification | null> {
    return this.persistence.read(
      classificationId,
    );
  }


  public async list(): Promise<
    HistoricalConversationEducationalClassification[]
  > {
    return this.persistence.list();
  }


  public async listByConversationId(
    conversationId:
      string,
  ): Promise<
    HistoricalConversationEducationalClassification[]
  > {
    return this.persistence.listByConversationId(
      conversationId,
    );
  }
}
