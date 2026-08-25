import {
  buildGenesisConversationAuthoritativeCompletenessEvidence,
} from "./GenesisConversationAuthoritativeCompletenessEvidence.js";

import type {
  GenesisConversationAuthoritativeCompletenessEvidence,
} from "./GenesisConversationAuthoritativeCompletenessEvidence.js";

import type {
  GenesisConversationExpectedHistoryCandidateReviewService,
} from "./GenesisConversationExpectedHistoryCandidateReviewService.js";

import type {
  GenesisConversationExpectedHistoryCandidateService,
} from "./GenesisConversationExpectedHistoryCandidateService.js";

import type {
  GenesisConversationHistoryReconciliationService,
} from "./GenesisConversationHistoryReconciliationService.js";


export class GenesisConversationAuthoritativeCompletenessEvidenceService {
  constructor(
    private readonly candidateService:
      GenesisConversationExpectedHistoryCandidateService,

    private readonly reviewService:
      GenesisConversationExpectedHistoryCandidateReviewService,

    private readonly reconciliationService:
      GenesisConversationHistoryReconciliationService,
  ) {}


  read():
    GenesisConversationAuthoritativeCompletenessEvidence {
    const candidate =
      this.candidateService
        .read();

    const review =
      this.reviewService
        .read();

    const reconciliation =
      this.reconciliationService
        .read();

    return buildGenesisConversationAuthoritativeCompletenessEvidence({
      candidate,

      review,

      acquisition:
        reconciliation.acquisitionInventory,

      authoritativeExpectedHistoryCreated:
        reconciliation.expectedHistory !==
        null,
    });
  }
}
