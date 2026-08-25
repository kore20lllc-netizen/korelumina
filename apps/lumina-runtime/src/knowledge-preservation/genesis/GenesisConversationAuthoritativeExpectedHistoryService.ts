import {
  buildGenesisConversationAuthoritativeExpectedHistory,
} from "./GenesisConversationAuthoritativeExpectedHistory.js";

import type {
  GenesisConversationExpectedHistoryCandidateService,
} from "./GenesisConversationExpectedHistoryCandidateService.js";

import type {
  GenesisConversationAuthoritativeCompletenessCertificationService,
} from "./GenesisConversationAuthoritativeCompletenessCertificationService.js";

import type {
  GenesisConversationHistoryReconciliationProjection,
  GenesisConversationHistoryReconciliationService,
} from "./GenesisConversationHistoryReconciliationService.js";


export class GenesisConversationAuthoritativeExpectedHistoryService {
  constructor(
    private readonly candidateService:
      GenesisConversationExpectedHistoryCandidateService,

    private readonly certificationService:
      GenesisConversationAuthoritativeCompletenessCertificationService,

    private readonly reconciliationService:
      GenesisConversationHistoryReconciliationService,
  ) {}


  create():
    GenesisConversationHistoryReconciliationProjection {
    const current =
      this.reconciliationService
        .read();

    if (
      current.expectedHistory !==
      null
    ) {
      throw new Error(
        "genesis_conversation_authoritative_expected_history_already_exists",
      );
    }

    const certificationProjection =
      this.certificationService
        .read();

    if (
      certificationProjection.state !==
        "VALID" ||
      certificationProjection.certification ===
        null ||
      !certificationProjection
        .authoritativeExpectedHistoryCreationAvailable
    ) {
      throw new Error(
        "genesis_conversation_authoritative_expected_history_certification_not_valid",
      );
    }

    const candidate =
      this.candidateService
        .read();

    if (
      candidate ===
      null
    ) {
      throw new Error(
        "genesis_conversation_authoritative_expected_history_candidate_unavailable",
      );
    }

    const inventory =
      buildGenesisConversationAuthoritativeExpectedHistory({
        candidate,

        certification:
          certificationProjection.certification,
      });

    return this.reconciliationService
      .saveExpectedHistory(
        inventory,
      );
  }
}
