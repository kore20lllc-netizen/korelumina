import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  GenesisConversationAcquisitionLatestState,
} from "./GenesisConversationAcquisitionExecution.js";

import type {
  HistoricalSourceId,
} from "./HistoricalSource.js";


export interface GenesisConversationReplayEvidenceReader {
  loadLatest():
    GenesisConversationAcquisitionLatestState |
    null;
}


export interface GenesisConversationReplayEvidenceResolver {
  resolve(
    historicalSourceId:
      HistoricalSourceId,
  ):
    EvidenceItem |
    null;
}


export interface PersistedGenesisConversationReplayEvidenceResolverOptions {
  acquisition:
    GenesisConversationReplayEvidenceReader;
}


export class PersistedGenesisConversationReplayEvidenceResolver
  implements GenesisConversationReplayEvidenceResolver
{
  private readonly acquisition:
    GenesisConversationReplayEvidenceReader;


  constructor(
    options:
      PersistedGenesisConversationReplayEvidenceResolverOptions,
  ) {
    this.acquisition =
      options.acquisition;
  }


  resolve(
    historicalSourceId:
      HistoricalSourceId,
  ):
    EvidenceItem |
    null {
    const latest =
      this.acquisition
        .loadLatest();

    if (
      !latest ||
      latest.state !==
        "ACQUIRED"
    ) {
      return null;
    }

    const matches =
      latest.evidence.filter(
        evidence =>
          evidence.metadata
            .historicalSourceId ===
          historicalSourceId,
      );

    if (
      matches.length >
      1
    ) {
      throw new Error(
        "genesis_conversation_replay_duplicate_evidence_custody",
      );
    }

    const evidence =
      matches[0];

    if (
      !evidence
    ) {
      return null;
    }

    return {
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
    };
  }
}
