import { createHash } from "node:crypto";


export const HISTORICAL_CONVERSATION_EDUCATIONAL_CLASSIFIER_ID =
  "historical-conversation-educational-classifier";

export const HISTORICAL_CONVERSATION_EDUCATIONAL_CLASSIFIER_VERSION =
  "1";


export const HISTORICAL_CONVERSATION_EDUCATIONAL_REQUIREMENT_IDS = [
  "conversation:architecture",
  "conversation:engineering",
  "conversation:mission",
  "conversation:governance",
  "conversation:operations",
] as const;


export type HistoricalConversationEducationalRequirementId =
  (typeof HISTORICAL_CONVERSATION_EDUCATIONAL_REQUIREMENT_IDS)[number];


export interface HistoricalConversationEducationalRequirementContribution {
  requirementId:
    HistoricalConversationEducationalRequirementId;

  evidenceIds:
    string[];

  basis:
    string;
}


export interface HistoricalConversationEducationalClassificationLineage {
  sourceConversationId:
    string;

  sourceEvidenceIds:
    string[];

  sourceChecksum:
    string;
}


export interface HistoricalConversationEducationalClassification {
  classificationId:
    string;

  checksum:
    string;

  conversationId:
    string;

  sourceEvidenceIds:
    string[];

  sourceChecksum:
    string;

  requirementContributions:
    HistoricalConversationEducationalRequirementContribution[];

  classifierId:
    string;

  classifierVersion:
    string;

  lineage:
    HistoricalConversationEducationalClassificationLineage;

  createdAt:
    number;
}


export interface CreateHistoricalConversationEducationalClassificationInput {
  conversationId:
    string;

  sourceEvidenceIds:
    string[];

  sourceChecksum:
    string;

  requirementContributions:
    HistoricalConversationEducationalRequirementContribution[];

  createdAt:
    number;

  classifierId?:
    string;

  classifierVersion?:
    string;
}


export type HistoricalConversationEducationalClassificationValidation =
  | {
      state:
        "VALID";
    }
  | {
      state:
        "INVALID";

      reason:
        string;
    };


interface HistoricalConversationEducationalClassificationIdentityPayload {
  conversationId:
    string;

  sourceEvidenceIds:
    string[];

  sourceChecksum:
    string;

  requirementContributions:
    HistoricalConversationEducationalRequirementContribution[];

  classifierId:
    string;

  classifierVersion:
    string;
}


const REQUIREMENT_ID_SET =
  new Set<string>(
    HISTORICAL_CONVERSATION_EDUCATIONAL_REQUIREMENT_IDS,
  );


function requireNonEmpty(
  value:
    string,
  reason:
    string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(reason);
  }

  return normalized;
}


function normalizeStringList(
  values:
    string[],
  emptyReason:
    string,
  memberReason:
    string,
): string[] {
  if (values.length === 0) {
    throw new Error(emptyReason);
  }

  const normalized =
    values.map(
      (value) =>
        requireNonEmpty(
          value,
          memberReason,
        ),
    );

  return [
    ...new Set(normalized),
  ].sort();
}


function normalizeRequirementContributions(
  contributions:
    HistoricalConversationEducationalRequirementContribution[],
): HistoricalConversationEducationalRequirementContribution[] {
  const seenRequirementIds =
    new Set<string>();

  const normalized =
    contributions.map(
      (
        contribution,
      ): HistoricalConversationEducationalRequirementContribution => {
        if (
          !REQUIREMENT_ID_SET.has(
            contribution.requirementId,
          )
        ) {
          throw new Error(
            "historical_conversation_educational_classification_requirement_not_governed",
          );
        }

        if (
          seenRequirementIds.has(
            contribution.requirementId,
          )
        ) {
          throw new Error(
            "historical_conversation_educational_classification_duplicate_requirement",
          );
        }

        seenRequirementIds.add(
          contribution.requirementId,
        );

        return {
          requirementId:
            contribution.requirementId,

          evidenceIds:
            normalizeStringList(
              contribution.evidenceIds,
              "historical_conversation_educational_classification_contribution_evidence_required",
              "historical_conversation_educational_classification_contribution_evidence_id_required",
            ),

          basis:
            requireNonEmpty(
              contribution.basis,
              "historical_conversation_educational_classification_basis_required",
            ),
        };
      },
    );

  return normalized.sort(
    (
      left,
      right,
    ) =>
      left.requirementId.localeCompare(
        right.requirementId,
      ),
  );
}


function identityPayload(
  input:
    CreateHistoricalConversationEducationalClassificationInput,
): HistoricalConversationEducationalClassificationIdentityPayload {
  const conversationId =
    requireNonEmpty(
      input.conversationId,
      "historical_conversation_educational_classification_conversation_id_required",
    );

  const sourceEvidenceIds =
    normalizeStringList(
      input.sourceEvidenceIds,
      "historical_conversation_educational_classification_source_evidence_required",
      "historical_conversation_educational_classification_source_evidence_id_required",
    );

  const sourceChecksum =
    requireNonEmpty(
      input.sourceChecksum,
      "historical_conversation_educational_classification_source_checksum_required",
    );

  const classifierId =
    requireNonEmpty(
      input.classifierId ??
        HISTORICAL_CONVERSATION_EDUCATIONAL_CLASSIFIER_ID,
      "historical_conversation_educational_classification_classifier_id_required",
    );

  const classifierVersion =
    requireNonEmpty(
      input.classifierVersion ??
        HISTORICAL_CONVERSATION_EDUCATIONAL_CLASSIFIER_VERSION,
      "historical_conversation_educational_classification_classifier_version_required",
    );

  return {
    conversationId,
    sourceEvidenceIds,
    sourceChecksum,

    requirementContributions:
      normalizeRequirementContributions(
        input.requirementContributions,
      ),

    classifierId,
    classifierVersion,
  };
}


function checksumIdentityPayload(
  payload:
    HistoricalConversationEducationalClassificationIdentityPayload,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        payload,
      ),
    )
    .digest(
      "hex",
    );
}


export function createHistoricalConversationEducationalClassification(
  input:
    CreateHistoricalConversationEducationalClassificationInput,
): HistoricalConversationEducationalClassification {
  if (
    !Number.isFinite(
      input.createdAt,
    ) ||
    input.createdAt < 0
  ) {
    throw new Error(
      "historical_conversation_educational_classification_created_at_invalid",
    );
  }

  const payload =
    identityPayload(
      input,
    );

  const checksum =
    checksumIdentityPayload(
      payload,
    );

  return {
    classificationId:
      `historical-conversation-educational-classification:${checksum}`,

    checksum,

    ...payload,

    lineage: {
      sourceConversationId:
        payload.conversationId,

      sourceEvidenceIds: [
        ...payload.sourceEvidenceIds,
      ],

      sourceChecksum:
        payload.sourceChecksum,
    },

    createdAt:
      input.createdAt,
  };
}


export function validateHistoricalConversationEducationalClassification(
  classification:
    HistoricalConversationEducationalClassification,
): HistoricalConversationEducationalClassificationValidation {
  try {
    const reconstructed =
      createHistoricalConversationEducationalClassification({
        conversationId:
          classification.conversationId,

        sourceEvidenceIds:
          classification.sourceEvidenceIds,

        sourceChecksum:
          classification.sourceChecksum,

        requirementContributions:
          classification.requirementContributions,

        classifierId:
          classification.classifierId,

        classifierVersion:
          classification.classifierVersion,

        createdAt:
          classification.createdAt,
      });

    if (
      classification.classificationId !==
      reconstructed.classificationId
    ) {
      return {
        state:
          "INVALID",

        reason:
          "historical_conversation_educational_classification_identity_mismatch",
      };
    }

    if (
      classification.checksum !==
      reconstructed.checksum
    ) {
      return {
        state:
          "INVALID",

        reason:
          "historical_conversation_educational_classification_checksum_mismatch",
      };
    }

    if (
      classification.lineage.sourceConversationId !==
        reconstructed.lineage.sourceConversationId ||
      classification.lineage.sourceChecksum !==
        reconstructed.lineage.sourceChecksum ||
      JSON.stringify(
        classification.lineage.sourceEvidenceIds,
      ) !==
        JSON.stringify(
          reconstructed.lineage.sourceEvidenceIds,
        )
    ) {
      return {
        state:
          "INVALID",

        reason:
          "historical_conversation_educational_classification_lineage_mismatch",
      };
    }

    return {
      state:
        "VALID",
    };
  } catch {
    return {
      state:
        "INVALID",

      reason:
        "historical_conversation_educational_classification_contract_invalid",
    };
  }
}
