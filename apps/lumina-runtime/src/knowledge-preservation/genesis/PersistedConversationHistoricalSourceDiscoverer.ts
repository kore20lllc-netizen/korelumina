import type {
  GenesisConversationAcquisitionLatestState,
} from "./GenesisConversationAcquisitionExecution.js";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSource,
} from "./HistoricalSource.js";

import type {
  HistoricalSourceDiscoverer,
  HistoricalSourceDiscoveryResult,
} from "./HistoricalSourceDiscovery.js";


export interface GenesisConversationAcquisitionReader {
  loadLatest():
    GenesisConversationAcquisitionLatestState |
    null;
}


export interface PersistedConversationHistoricalSourceDiscovererOptions {
  acquisition:
    GenesisConversationAcquisitionReader;

  discovererId?:
    string;
}


function conversationIncluded(
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


function sourceInScope(
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
    scope.explicitlyExcludedSourceIds.includes(
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
    source.historicalTimestamp.value <
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
    source.historicalTimestamp.value >
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


function compareSources(
  left:
    HistoricalSource,

  right:
    HistoricalSource,
): number {
  const timestampOrder =
    left.historicalTimestamp.value -
    right.historicalTimestamp.value;

  if (
    timestampOrder !==
    0
  ) {
    return timestampOrder;
  }

  const locatorOrder =
    left.provenance.locator.localeCompare(
      right.provenance.locator,
    );

  if (
    locatorOrder !==
    0
  ) {
    return locatorOrder;
  }

  return left.historicalSourceId.localeCompare(
    right.historicalSourceId,
  );
}


export class PersistedConversationHistoricalSourceDiscoverer
  implements HistoricalSourceDiscoverer
{
  readonly id:
    string;

  readonly sourceClasses =
    [
      "conversation",
    ] as const;

  private readonly acquisition:
    GenesisConversationAcquisitionReader;


  constructor(
    options:
      PersistedConversationHistoricalSourceDiscovererOptions,
  ) {
    this.acquisition =
      options.acquisition;

    this.id =
      options.discovererId ??
      "persisted-conversation-history-v1";
  }


  async discover(
    scope:
      GenesisReplayScope,
  ): Promise<
    HistoricalSourceDiscoveryResult
  > {
    if (
      !conversationIncluded(
        scope,
      )
    ) {
      return {
        discovererId:
          this.id,

        sources:
          [],

        errors:
          [],
      };
    }

    const latest =
      this.acquisition
        .loadLatest();

    if (
      !latest
    ) {
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
              "No persisted historical conversation acquisition exists.",

            cause:
              "conversation-acquisition-not-executed",
          },
        ],
      };
    }

    if (
      latest.state ===
      "FAILED"
    ) {
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
              "Latest historical conversation acquisition failed.",

            cause:
              latest.error,
          },
        ],
      };
    }

    const evidenceSourceIds =
      new Set(
        latest.evidence
          .map(
            evidence =>
              evidence.metadata
                .historicalSourceId,
          )
          .filter(
            (
              value,
            ): value is string =>
              typeof value ===
                "string",
          ),
      );

    const sourceIds =
      new Set<string>();

    for (
      const source
      of latest.historicalSources
    ) {
      if (
        source.sourceClass !==
          "conversation" ||
        source.evidenceType !==
          "conversation"
      ) {
        throw new Error(
          "genesis_persisted_conversation_source_class_mismatch",
        );
      }

      if (
        sourceIds.has(
          source.historicalSourceId,
        )
      ) {
        throw new Error(
          "genesis_persisted_conversation_duplicate_historical_source",
        );
      }

      sourceIds.add(
        source.historicalSourceId,
      );

      if (
        !evidenceSourceIds.has(
          source.historicalSourceId,
        )
      ) {
        throw new Error(
          "genesis_persisted_conversation_evidence_custody_missing",
        );
      }
    }

    if (
      evidenceSourceIds.size !==
      latest.historicalSources.length
    ) {
      throw new Error(
        "genesis_persisted_conversation_evidence_custody_mismatch",
      );
    }

    return {
      discovererId:
        this.id,

      sources:
        latest.historicalSources
          .map(
            source =>
              sourceInScope(
                source,
                scope,
              ),
          )
          .sort(
            compareSources,
          ),

      errors: [
        ...latest.errors,
      ],
    };
  }
}
