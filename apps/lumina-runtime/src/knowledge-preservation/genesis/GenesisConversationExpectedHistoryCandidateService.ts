import type {
  FileGenesisConversationAcquisitionPersistenceStore,
} from "./GenesisConversationAcquisitionExecution.js";

import {
  buildGenesisConversationExpectedHistoryCandidate,
} from "./GenesisConversationExpectedHistoryCandidate.js";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "./GenesisConversationExpectedHistoryCandidate.js";

import type {
  FileGenesisConversationExpectedHistoryCandidatePersistenceStore,
} from "./GenesisConversationExpectedHistoryCandidatePersistence.js";


export class GenesisConversationExpectedHistoryCandidateService {
  constructor(
    private readonly acquisition:
      FileGenesisConversationAcquisitionPersistenceStore,

    private readonly persistence:
      FileGenesisConversationExpectedHistoryCandidatePersistenceStore,

    private readonly now:
      () => number =
        () =>
          Date.now(),
  ) {}


  read():
    GenesisConversationExpectedHistoryCandidate |
    null {
    return this.persistence
      .load();
  }


  generate():
    GenesisConversationExpectedHistoryCandidate {
    const latest =
      this.acquisition
        .loadLatest();

    if (
      !latest ||
      latest.state !==
        "ACQUIRED"
    ) {
      throw new Error(
        "genesis_conversation_expected_history_candidate_acquisition_unavailable",
      );
    }

    const candidate =
      buildGenesisConversationExpectedHistoryCandidate(
        latest,
        this.now(),
      );

    this.persistence
      .save(
        candidate,
      );

    return candidate;
  }
}
