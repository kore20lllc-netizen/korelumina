import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  GenesisHistoricalConversationInput,
} from "./GenesisConversationAcquisition.js";

import {
  acquireGenesisHistoricalConversation,
} from "./GenesisConversationAcquisition.js";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSource,
  HistoricalSourceId,
} from "./HistoricalSource.js";

import type {
  HistoricalSourceDiscoverer,
  HistoricalSourceDiscoveryError,
  HistoricalSourceDiscoveryResult,
} from "./HistoricalSourceDiscovery.js";


export type GenesisConversationHistoricalGapState =
  | "not-yet-acquired"
  | "historically-unavailable"
  | "permission-blocked"
  | "source-unavailable";


export interface GenesisConversationHistoricalGap {
  state:
    GenesisConversationHistoricalGapState;

  conversationId?:
    string;

  sourceLocator?:
    string;

  detail:
    string;
}


export interface GenesisConversationAcquisitionSnapshot {
  acquisitionId:
    string;

  acquiredAt:
    number;

  conversations:
    readonly GenesisHistoricalConversationInput[];

  gaps:
    readonly GenesisConversationHistoricalGap[];
}


export interface GenesisHistoricalConversationSource {
  readonly id:
    string;

  acquire():
    Promise<
      GenesisConversationAcquisitionSnapshot
    >;
}


export interface GenesisHistoricalConversationSourceAdapterOptions {
  source:
    GenesisHistoricalConversationSource;

  discovererId?:
    string;
}


function evidenceTypeInScope(
  scope:
    GenesisReplayScope,
): boolean {
  return (
    scope.includedEvidenceTypes.includes(
      "conversation",
    ) &&
    !scope.excludedEvidenceTypes.includes(
      "conversation",
    )
  );
}


function scopedSource(
  source:
    HistoricalSource,

  scope:
    GenesisReplayScope,
): HistoricalSource {
  if (
    source.replayEligibility ===
    "blocked"
  ) {
    return source;
  }

  if (
    !evidenceTypeInScope(
      scope,
    )
  ) {
    return {
      ...source,

      replayEligibility:
        "excluded",

      exclusionReason:
        "evidence_type_outside_replay_scope",
    };
  }

  if (
    scope
      .explicitlyExcludedSourceIds
      .includes(
        source.historicalSourceId,
      )
  ) {
    return {
      ...source,

      replayEligibility:
        "excluded",

      exclusionReason:
        "explicit_source_exclusion",
    };
  }

  if (
    scope.historicalStart !==
      undefined &&
    source
      .historicalTimestamp
      .value <
      scope.historicalStart
  ) {
    return {
      ...source,

      replayEligibility:
        "excluded",

      exclusionReason:
        "before_replay_scope",
    };
  }

  if (
    scope.historicalEnd !==
      undefined &&
    source
      .historicalTimestamp
      .value >
      scope.historicalEnd
  ) {
    return {
      ...source,

      replayEligibility:
        "excluded",

      exclusionReason:
        "after_replay_scope",
    };
  }

  return source;
}


function gapToDiscoveryError(
  discovererId:
    string,

  gap:
    GenesisConversationHistoricalGap,
): HistoricalSourceDiscoveryError {
  return {
    code:
      gap.state ===
        "permission-blocked"
        ? "GOVERNANCE_BLOCKED"
        : "SOURCE_UNAVAILABLE",

    discovererId,

    provenanceLocator:
      gap.sourceLocator,

    message:
      gap.detail,

    cause:
      gap.state,
  };
}


function compareHistoricalSources(
  left:
    HistoricalSource,

  right:
    HistoricalSource,
): number {
  const timestamp =
    left
      .historicalTimestamp
      .value -
    right
      .historicalTimestamp
      .value;

  if (
    timestamp !==
    0
  ) {
    return timestamp;
  }

  const locator =
    left
      .provenance
      .locator
      .localeCompare(
        right
          .provenance
          .locator,
      );

  if (
    locator !==
    0
  ) {
    return locator;
  }

  return left
    .historicalSourceId
    .localeCompare(
      right.historicalSourceId,
    );
}


export class GenesisHistoricalConversationSourceAdapter
  implements HistoricalSourceDiscoverer
{
  readonly id:
    string;

  readonly sourceClasses =
    [
      "conversation",
    ] as const;

  private readonly source:
    GenesisHistoricalConversationSource;

  private evidenceByHistoricalSourceId =
    new Map<
      HistoricalSourceId,
      EvidenceItem
    >();

  private latestSnapshot:
    GenesisConversationAcquisitionSnapshot |
    null =
      null;


  constructor(
    options:
      GenesisHistoricalConversationSourceAdapterOptions,
  ) {
    this.source =
      options.source;

    this.id =
      options.discovererId ??
      `conversation-source:${this.source.id}`;
  }


  async discover(
    scope:
      GenesisReplayScope,
  ): Promise<
    HistoricalSourceDiscoveryResult
  > {
    let snapshot:
      GenesisConversationAcquisitionSnapshot;

    try {
      snapshot =
        await this.source.acquire();
    } catch (
      error
    ) {
      this.latestSnapshot =
        null;

      this.evidenceByHistoricalSourceId =
        new Map();

      return {
        discovererId:
          this.id,

        sources:
          [],

        errors: [
          {
            code:
              "SOURCE_UNAVAILABLE",

            discovererId:
              this.id,

            message:
              "Historical conversation acquisition source is unavailable.",

            cause:
              error instanceof Error
                ? error.message
                : String(
                    error,
                  ),
          },
        ],
      };
    }

    this.latestSnapshot =
      snapshot;

    const evidence =
      new Map<
        HistoricalSourceId,
        EvidenceItem
      >();

    const sources:
      HistoricalSource[] =
        [];

    const errors:
      HistoricalSourceDiscoveryError[] =
        snapshot.gaps.map(
          (
            gap,
          ) =>
            gapToDiscoveryError(
              this.id,
              gap,
            ),
        );

    const orderedConversations =
      [
        ...snapshot.conversations,
      ].sort(
        (
          left,
          right,
        ) =>
          left.conversationId
            .localeCompare(
              right.conversationId,
            ),
      );

    for (
      const conversation
      of orderedConversations
    ) {
      let acquired;

      try {
        acquired =
          acquireGenesisHistoricalConversation(
            conversation,
          );
      } catch (
        error
      ) {
        errors.push({
          code:
            "DISCOVERY_FAILED",

          discovererId:
            this.id,

          message:
            `Conversation acquisition materialization failed: ${conversation.conversationId}`,

          cause:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        });

        continue;
      }

      for (
        const message
        of acquired.messages
      ) {
        const source =
          scopedSource(
            message.historicalSource,
            scope,
          );

        const existingEvidence =
          evidence.get(
            source.historicalSourceId,
          );

        if (
          existingEvidence &&
          (
            existingEvidence.id !==
              message.evidence.id ||
            existingEvidence.checksum !==
              message.evidence.checksum
          )
        ) {
          throw new Error(
            "genesis_conversation_adapter_evidence_identity_conflict",
          );
        }

        evidence.set(
          source.historicalSourceId,
          message.evidence,
        );

        sources.push(
          source,
        );
      }
    }

    const sourceIds =
      new Set<
        HistoricalSourceId
      >();

    for (
      const source
      of sources
    ) {
      if (
        sourceIds.has(
          source.historicalSourceId,
        )
      ) {
        throw new Error(
          "genesis_conversation_adapter_duplicate_historical_source",
        );
      }

      sourceIds.add(
        source.historicalSourceId,
      );
    }

    this.evidenceByHistoricalSourceId =
      evidence;

    const gapStatePriority:
      Readonly<
        Record<
          string,
          number
        >
      > = {
        "historically-unavailable":
          0,

        "permission-blocked":
          1,

        "source-unavailable":
          2,

        "not-yet-acquired":
          3,
      };

    return {
      discovererId:
        this.id,

      sources:
        sources.sort(
          compareHistoricalSources,
        ),

      errors:
        errors.sort(
          (
            left,
            right,
          ) => {
            const stateOrder =
              (
                gapStatePriority[
                  left.cause ??
                  ""
                ] ??
                Number.MAX_SAFE_INTEGER
              ) -
              (
                gapStatePriority[
                  right.cause ??
                  ""
                ] ??
                Number.MAX_SAFE_INTEGER
              );

            if (
              stateOrder !==
              0
            ) {
              return stateOrder;
            }

            const locatorOrder =
              (
                left.provenanceLocator ??
                ""
              ).localeCompare(
                right.provenanceLocator ??
                "",
              );

            if (
              locatorOrder !==
              0
            ) {
              return locatorOrder;
            }

            return left.message.localeCompare(
              right.message,
            );
          },
        ),
    };
  }


  evidenceForHistoricalSource(
    historicalSourceId:
      HistoricalSourceId,
  ): EvidenceItem |
    null {
    const evidence =
      this
        .evidenceByHistoricalSourceId
        .get(
          historicalSourceId,
        );

    return evidence
      ? {
          ...evidence,

          metadata: {
            ...evidence.metadata,
          },

          relationships:
            Object.fromEntries(
              Object.entries(
                evidence.relationships,
              ).map(
                (
                  [
                    relationship,
                    refs,
                  ],
                ) => [
                  relationship,
                  [
                    ...refs,
                  ],
                ],
              ),
            ),
        }
      : null;
  }


  listAcquiredEvidence():
    readonly EvidenceItem[] {
    return [
      ...this
        .evidenceByHistoricalSourceId
        .values(),
    ]
      .map(
        (
          evidence,
        ) => ({
          ...evidence,

          metadata: {
            ...evidence.metadata,
          },

          relationships:
            Object.fromEntries(
              Object.entries(
                evidence.relationships,
              ).map(
                (
                  [
                    relationship,
                    refs,
                  ],
                ) => [
                  relationship,
                  [
                    ...refs,
                  ],
                ],
              ),
            ),
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.id.localeCompare(
            right.id,
          ),
      );
  }


  acquisitionSnapshot():
    GenesisConversationAcquisitionSnapshot |
    null {
    return this.latestSnapshot;
  }
}
