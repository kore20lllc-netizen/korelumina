import {
  buildGenesisDayZeroConversationCoverageEvidence,
} from "./GenesisDayZeroConversationCoverageEvidence.js";

import type {
  GenesisDayZeroConversationCoverageEvidence,
} from "./GenesisDayZeroConversationCoverageEvidence.js";

import type {
  GenesisConversationHistoryReconciliationService,
} from "./GenesisConversationHistoryReconciliationService.js";

import type {
  GenesisConversationCorrelationCompletenessProjection,
} from "./GenesisConversationCorrelationCompleteness.js";


export interface GenesisConversationCorrelationCompletenessReader {
  read():
    GenesisConversationCorrelationCompletenessProjection;
}


export class GenesisDayZeroConversationCoverageEvidenceService {
  constructor(
    private readonly reconciliationService:
      GenesisConversationHistoryReconciliationService,

    private readonly correlationService:
      GenesisConversationCorrelationCompletenessReader,
  ) {}


  read():
    GenesisDayZeroConversationCoverageEvidence {
    return buildGenesisDayZeroConversationCoverageEvidence({
      conversationHistory:
        this.reconciliationService
          .read(),

      conversationCorrelation:
        this.correlationService
          .read(),
    });
  }
}
