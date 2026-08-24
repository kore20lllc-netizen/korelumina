import {
  createHash,
} from "node:crypto";

import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  HistoricalSource,
  HistoricalSourceId,
} from "./HistoricalSource.js";

import {
  createHistoricalSourceId,
} from "./HistoricalSourceIdentity.js";


export type GenesisConversationSpeakerRole =
  | "user"
  | "assistant"
  | "system"
  | "developer"
  | "tool"
  | "unknown";


export type GenesisConversationSegmentAvailability =
  | "available"
  | "deleted"
  | "missing"
  | "unavailable";


export interface GenesisConversationPrivacyMetadata {
  sensitivity:
    "standard" |
    "sensitive" |
    "restricted";

  containsPersonalData:
    boolean;

  handlingNotes?:
    readonly string[];
}


export interface GenesisConversationAcquisitionProvenance {
  provider:
    string;

  acquisitionMethod:
    string;

  acquiredAt:
    number;

  sourceLocator:
    string;

  exportId?:
    string;

  exportRevision?:
    string;
}


export type GenesisConversationExplicitHistoricalRelationshipType =
  | "supersedes"
  | "conflicts-with";


export interface GenesisConversationExplicitHistoricalRelationship {
  type:
    GenesisConversationExplicitHistoricalRelationshipType;

  historicalSourceId:
    HistoricalSourceId;

  basis:
    string;
}


export interface GenesisHistoricalConversationMessageInput {
  messageId:
    string;

  role:
    GenesisConversationSpeakerRole;

  order:
    number;

  timestamp?:
    number;

  content?:
    string;

  availability:
    GenesisConversationSegmentAvailability;

  sourceLocator?:
    string;

  explicitHistoricalRelationships?:
    readonly GenesisConversationExplicitHistoricalRelationship[];

  metadata?:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}


export interface GenesisHistoricalConversationInput {
  conversationId:
    string;

  projectId?:
    string;

  title?:
    string;

  createdAt?:
    number;

  updatedAt?:
    number;

  sourceRevision?:
    string;

  acquisition:
    GenesisConversationAcquisitionProvenance;

  privacy:
    GenesisConversationPrivacyMetadata;

  messages:
    readonly GenesisHistoricalConversationMessageInput[];
}


export interface GenesisConversationAcquiredMessage {
  historicalSource:
    HistoricalSource;

  evidence:
    EvidenceItem;
}


export interface GenesisConversationAcquisitionResult {
  conversationId:
    string;

  projectId:
    string | null;

  sourceRevision:
    string | null;

  conversationChecksum:
    string;

  acquiredAt:
    number;

  messages:
    readonly GenesisConversationAcquiredMessage[];
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
          (
            key,
          ) => [
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


function sha256(
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


function requireNonEmpty(
  value:
    string,
  error:
    string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length ===
      0
  ) {
    throw new Error(
      error,
    );
  }

  return normalized;
}


function assertTimestamp(
  value:
    number,
  error:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      error,
    );
  }
}


function validateInput(
  input:
    GenesisHistoricalConversationInput,
): void {
  requireNonEmpty(
    input.conversationId,
    "genesis_conversation_identity_required",
  );

  requireNonEmpty(
    input.acquisition.provider,
    "genesis_conversation_provider_required",
  );

  requireNonEmpty(
    input.acquisition.acquisitionMethod,
    "genesis_conversation_acquisition_method_required",
  );

  requireNonEmpty(
    input.acquisition.sourceLocator,
    "genesis_conversation_source_locator_required",
  );

  assertTimestamp(
    input.acquisition.acquiredAt,
    "genesis_conversation_acquired_at_invalid",
  );

  const identities =
    new Set<string>();

  const orders =
    new Set<number>();

  for (
    const message
    of input.messages
  ) {
    const messageId =
      requireNonEmpty(
        message.messageId,
        "genesis_conversation_message_identity_required",
      );

    if (
      identities.has(
        messageId,
      )
    ) {
      throw new Error(
        "genesis_conversation_duplicate_message_identity",
      );
    }

    identities.add(
      messageId,
    );

    if (
      !Number.isSafeInteger(
        message.order,
      ) ||
      message.order <
        0
    ) {
      throw new Error(
        "genesis_conversation_message_order_invalid",
      );
    }

    if (
      orders.has(
        message.order,
      )
    ) {
      throw new Error(
        "genesis_conversation_duplicate_message_order",
      );
    }

    orders.add(
      message.order,
    );

    if (
      message.timestamp !==
        undefined
    ) {
      assertTimestamp(
        message.timestamp,
        "genesis_conversation_message_timestamp_invalid",
      );
    }

    if (
      message.availability ===
        "available" &&
      typeof message.content !==
        "string"
    ) {
      throw new Error(
        "genesis_conversation_available_message_content_required",
      );
    }

    if (
      message.availability !==
        "available" &&
      message.content !==
        undefined
    ) {
      throw new Error(
        "genesis_conversation_unavailable_message_content_forbidden",
      );
    }

    const relationshipKeys =
      new Set<string>();

    for (
      const relationship
      of message.explicitHistoricalRelationships ??
      []
    ) {
      if (
        relationship.type !==
          "supersedes" &&
        relationship.type !==
          "conflicts-with"
      ) {
        throw new Error(
          "genesis_conversation_historical_relationship_type_invalid",
        );
      }

      requireNonEmpty(
        relationship.historicalSourceId,
        "genesis_conversation_historical_relationship_source_required",
      );

      requireNonEmpty(
        relationship.basis,
        "genesis_conversation_historical_relationship_basis_required",
      );

      const key =
        `${relationship.type}:${relationship.historicalSourceId}`;

      if (
        relationshipKeys.has(
          key,
        )
      ) {
        throw new Error(
          "genesis_conversation_duplicate_historical_relationship",
        );
      }

      relationshipKeys.add(
        key,
      );
    }
  }
}


function messageLocator(
  input:
    GenesisHistoricalConversationInput,

  message:
    GenesisHistoricalConversationMessageInput,
): string {
  if (
    message.sourceLocator
  ) {
    return requireNonEmpty(
      message.sourceLocator,
      "genesis_conversation_message_source_locator_invalid",
    );
  }

  return (
    `${input.acquisition.sourceLocator}` +
    `#conversation=${encodeURIComponent(input.conversationId)}` +
    `&message=${encodeURIComponent(message.messageId)}`
  );
}


function messageStableSourceKey(
  input:
    GenesisHistoricalConversationInput,

  message:
    GenesisHistoricalConversationMessageInput,
): string {
  return (
    `conversation:${input.acquisition.provider}:` +
    `${input.conversationId}:message:${message.messageId}`
  );
}


function historicalTimestamp(
  input:
    GenesisHistoricalConversationInput,

  message:
    GenesisHistoricalConversationMessageInput,
): {
  value: number;
  source: string;
} {
  if (
    message.timestamp !==
      undefined
  ) {
    return {
      value:
        message.timestamp,

      source:
        "authoritative-conversation-message-timestamp",
    };
  }

  if (
    input.createdAt !==
      undefined
  ) {
    return {
      value:
        input.createdAt,

      source:
        "conversation-created-at-fallback",
    };
  }

  return {
    value:
      input.acquisition.acquiredAt,

    source:
      "acquisition-time-fallback",
  };
}


export function acquireGenesisHistoricalConversation(
  input:
    GenesisHistoricalConversationInput,
): GenesisConversationAcquisitionResult {
  validateInput(
    input,
  );

  const orderedMessages =
    [...input.messages]
      .sort(
        (
          left,
          right,
        ) =>
          left.order -
          right.order,
      );

  const conversationChecksum =
    sha256({
      conversationId:
        input.conversationId,

      projectId:
        input.projectId ?? null,

      createdAt:
        input.createdAt ?? null,

      updatedAt:
        input.updatedAt ?? null,

      sourceRevision:
        input.sourceRevision ?? null,

      provider:
        input.acquisition.provider,

      messages:
        orderedMessages.map(
          (
            message,
          ) => ({
            messageId:
              message.messageId,

            role:
              message.role,

            order:
              message.order,

            timestamp:
              message.timestamp ?? null,

            availability:
              message.availability,

            content:
              message.content ?? null,

            sourceLocator:
              message.sourceLocator ?? null,

            explicitHistoricalRelationships:
              message.explicitHistoricalRelationships ??
              [],

            metadata:
              message.metadata ?? {},
          }),
        ),
    });

  const messages =
    orderedMessages.map(
      (
        message,
      ): GenesisConversationAcquiredMessage => {
        const locator =
          messageLocator(
            input,
            message,
          );

        const stableSourceKey =
          messageStableSourceKey(
            input,
            message,
          );

        const sourceChecksum =
          sha256({
            conversationId:
              input.conversationId,

            messageId:
              message.messageId,

            role:
              message.role,

            order:
              message.order,

            timestamp:
              message.timestamp ?? null,

            availability:
              message.availability,

            content:
              message.content ?? null,

            sourceRevision:
              input.sourceRevision ?? null,

            explicitHistoricalRelationships:
              message.explicitHistoricalRelationships ??
              [],

            locator,
          });

        const historicalSourceId =
          createHistoricalSourceId(
            "conversation",
            stableSourceKey,
          );

        const timestamp =
          historicalTimestamp(
            input,
            message,
          );

        const historicalSource:
          HistoricalSource = {
            historicalSourceId,

            sourceClass:
              "conversation",

            evidenceType:
              "conversation",

            stableSourceKey,

            sourceChecksum,

            provenance: {
              locator,

              nativeId:
                message.messageId,
            },

            historicalTimestamp:
              timestamp,

            discoveredAt:
              input.acquisition.acquiredAt,

            discoveryMethod:
              input.acquisition.acquisitionMethod,

            authority: {
              authorityClass:
                "external-conversation-evidence",

              owner:
                input.acquisition.provider,

              scope:
                input.projectId,

              version:
                input.sourceRevision,
            },

            replayEligibility:
              message.availability ===
                "available"
                ? "eligible"
                : "blocked",

            exclusionReason:
              message.availability ===
                "available"
                ? undefined
                : (
                    `conversation-segment-${message.availability}`
                  ),

            supersedes:
              (
                message.explicitHistoricalRelationships ??
                []
              )
                .filter(
                  relationship =>
                    relationship.type ===
                    "supersedes",
                )
                .map(
                  relationship =>
                    relationship.historicalSourceId,
                )
                .sort(),

            conflictsWith:
              (
                message.explicitHistoricalRelationships ??
                []
              )
                .filter(
                  relationship =>
                    relationship.type ===
                    "conflicts-with",
                )
                .map(
                  relationship =>
                    relationship.historicalSourceId,
                )
                .sort(),

            metadata: {
              conversationId:
                input.conversationId,

              projectId:
                input.projectId ?? null,

              messageId:
                message.messageId,

              speakerRole:
                message.role,

              messageOrder:
                message.order,

              segmentAvailability:
                message.availability,

              sourceRevision:
                input.sourceRevision ?? null,

              conversationChecksum,

              privacy:
                input.privacy,

              acquisition: {
                provider:
                  input.acquisition.provider,

                method:
                  input.acquisition.acquisitionMethod,

                acquiredAt:
                  input.acquisition.acquiredAt,

                exportId:
                  input.acquisition.exportId ?? null,

                exportRevision:
                  input.acquisition.exportRevision ?? null,
              },

              explicitHistoricalRelationships:
                (
                  message.explicitHistoricalRelationships ??
                  []
                ).map(
                  relationship => ({
                    ...relationship,
                  }),
                ),

              originalMetadata:
                message.metadata ?? {},
            },
          };

        const evidenceId =
          `genesis-conversation-evidence:${sourceChecksum}`;

        const evidence:
          EvidenceItem = {
            id:
              evidenceId,

            type:
              "conversation",

            title:
              input.title
                ? `${input.title} — message ${message.order}`
                : `Conversation ${input.conversationId} — message ${message.order}`,

            source:
              input.acquisition.provider,

            capturedAt:
              input.acquisition.acquiredAt,

            observedAt:
              Math.min(
                timestamp.value,
                input.acquisition.acquiredAt,
              ),

            contentRef:
              locator,

            checksum:
              sourceChecksum,

            metadata: {
              content:
                message.availability ===
                  "available"
                  ? (
                      message.content ??
                      ""
                    )
                  : "",

              conversationId:
                input.conversationId,

              projectId:
                input.projectId ?? null,

              messageId:
                message.messageId,

              speakerRole:
                message.role,

              messageOrder:
                message.order,

              historicalSourceId,

              sourceLocation:
                locator,

              sourceRevision:
                input.sourceRevision ?? null,

              segmentAvailability:
                message.availability,

              conversationChecksum,

              privacy:
                input.privacy,

              acquisition:
                historicalSource
                  .metadata
                  .acquisition,

              explicitHistoricalRelationships:
                (
                  message.explicitHistoricalRelationships ??
                  []
                ).map(
                  relationship => ({
                    ...relationship,
                  }),
                ),

              originalMetadata:
                message.metadata ?? {},
            },

            relationships: {
              historicalSource: [
                historicalSourceId,
              ],

              conversation: [
                input.conversationId,
              ],
            },
          };

        return {
          historicalSource,
          evidence,
        };
      },
    );

  return {
    conversationId:
      input.conversationId,

    projectId:
      input.projectId ?? null,

    sourceRevision:
      input.sourceRevision ?? null,

    conversationChecksum,

    acquiredAt:
      input.acquisition.acquiredAt,

    messages,
  };
}


export function acquiredHistoricalSourceIds(
  result:
    GenesisConversationAcquisitionResult,
): readonly HistoricalSourceId[] {
  return result.messages.map(
    (
      message,
    ) =>
      message
        .historicalSource
        .historicalSourceId,
  );
}
