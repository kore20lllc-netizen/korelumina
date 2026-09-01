import type {
  EvidenceItem,
  EvidencePersistenceStore,
} from "../evidence/index.js";

import {
  FileEvidencePersistenceStore,
} from "../evidence/index.js";

import type {
  KnowledgeManufacturingRun,
} from "../manufacturing/index.js";

import type {
  KnowledgePreservationPlatform,
  KnowledgeReprocessingRequest,
} from "../bootstrap/index.js";

import type {
  GenesisReplayAdmissionAdapter,
  GenesisReplayAdmissionRequest,
  GenesisReplayAdmissionResult,
} from "./GenesisReplayExecution.js";

import {
  createGenesisReplayAdmissionIdentity,
  genesisReplayAdmissionRequestToEvidence,
} from "./GenesisReplayAdmission.js";

import {
  classifyGenesisHistoricalAdmission,
} from "./GenesisHistoricalAdmissionGovernancePolicy.js";

import type {
  GenesisHistoricalEvidenceReviewDecisionResolver,
} from "./GenesisHistoricalEvidenceReviewDecision.js";

import {
  manifestEntryWithHistoricalEvidenceReview,
} from "./GenesisHistoricalEvidenceReviewDecision.js";

import type {
  GenesisConversationReplayEvidenceResolver,
} from "./GenesisConversationReplayEvidenceResolver.js";


export interface GenesisProductionReplayReviewedManufacturingRequest {
  historicalSourceId:
    string;
}


export interface GenesisProductionReplayReprocessingRequest
  extends KnowledgeReprocessingRequest
{
  historicalSourceId:
    string;
}


export interface GenesisProductionReplayAdmissionAdapterOptions {
  platform:
    KnowledgePreservationPlatform;

  conversationEvidenceResolver?:
    GenesisConversationReplayEvidenceResolver;

  reprocessing?:
    GenesisProductionReplayReprocessingRequest;

  reviewedManufacturing?:
    GenesisProductionReplayReviewedManufacturingRequest;

  historicalEvidenceReviewDecisionResolver?:
    GenesisHistoricalEvidenceReviewDecisionResolver;

  evidencePersistenceStore?:
    EvidencePersistenceStore;
}


function evidenceRun(
  platform:
    KnowledgePreservationPlatform,

  evidenceId:
    string,
): KnowledgeManufacturingRun |
  undefined {
  return platform
    .manufacturingRunService
    .list()
    .find(
      run =>
        run.evidenceId ===
        evidenceId,
    );
}


function evidenceIntakeCompleted(
  run:
    KnowledgeManufacturingRun,
): boolean {
  return run.stageHistory.some(
    event =>
      event.stage ===
        "Evidence Intake" &&
      event.outcome ===
        "completed",
  );
}


function assertProductionAdmissionRequest(
  request:
    GenesisReplayAdmissionRequest,
): void {
  if (
    request.planEntry.action !==
    "ADMIT"
  ) {
    throw new Error(
      "genesis_production_admission_requires_admit_action",
    );
  }

  if (
    request.manifestEntry.replayEligibility !==
    "eligible"
  ) {
    throw new Error(
      "genesis_production_admission_requires_eligible_source",
    );
  }

  if (
    request.planEntry.historicalSourceId !==
    request.manifestEntry.historicalSourceId
  ) {
    throw new Error(
      "genesis_production_admission_source_identity_mismatch",
    );
  }

  if (
    request.planEntry.sourceChecksum !==
    request.manifestEntry.sourceChecksum
  ) {
    throw new Error(
      "genesis_production_admission_source_checksum_mismatch",
    );
  }

  const expectedAdmissionIdentity =
    createGenesisReplayAdmissionIdentity(
      request,
    );

  if (
    request.admissionIdentity !==
    expectedAdmissionIdentity
  ) {
    throw new Error(
      "genesis_replay_admission_identity_mismatch",
    );
  }
}


function existingAdmissionResult(
  run:
    KnowledgeManufacturingRun,

  evidence:
    EvidenceItem,
): GenesisReplayAdmissionResult {
  if (
    run.evidenceId !==
    evidence.id
  ) {
    throw new Error(
      "genesis_production_admission_existing_run_evidence_mismatch",
    );
  }

  if (
    !evidenceIntakeCompleted(
      run,
    )
  ) {
    throw new Error(
      "genesis_production_admission_existing_run_not_admitted",
    );
  }

  return {
    evidenceId:
      evidence.id,
  };
}


export class GenesisProductionReplayAdmissionAdapter
  implements GenesisReplayAdmissionAdapter
{
  private readonly platform:
    KnowledgePreservationPlatform;

  private readonly conversationEvidenceResolver:
    GenesisConversationReplayEvidenceResolver |
    null;

  private readonly reprocessing:
    GenesisProductionReplayReprocessingRequest |
    null;

  private readonly reviewedManufacturing:
    GenesisProductionReplayReviewedManufacturingRequest |
    null;

  private readonly historicalEvidenceReviewDecisionResolver:
    GenesisHistoricalEvidenceReviewDecisionResolver |
    null;

  private readonly evidencePersistenceStore:
    EvidencePersistenceStore;


  constructor(
    options:
      GenesisProductionReplayAdmissionAdapterOptions,
  ) {
    this.platform =
      options.platform;

    this.conversationEvidenceResolver =
      options.conversationEvidenceResolver ??
      null;

    this.reprocessing =
      options.reprocessing ??
      null;

    this.reviewedManufacturing =
      options.reviewedManufacturing ??
      null;

    this.historicalEvidenceReviewDecisionResolver =
      options.historicalEvidenceReviewDecisionResolver ??
      null;

    this.evidencePersistenceStore =
      options.evidencePersistenceStore ??
      new FileEvidencePersistenceStore();
  }


  private evidenceFor(
    request:
      GenesisReplayAdmissionRequest,
  ): EvidenceItem {
    if (
      request.manifestEntry.evidenceType !==
      "conversation"
    ) {
      return genesisReplayAdmissionRequestToEvidence(
        request,
      );
    }

    if (
      !this.conversationEvidenceResolver
    ) {
      throw new Error(
        "genesis_conversation_replay_evidence_resolver_required",
      );
    }

    const evidence =
      this.conversationEvidenceResolver.resolve(
        request.manifestEntry.historicalSourceId,
      );

    if (
      !evidence
    ) {
      throw new Error(
        "genesis_conversation_replay_evidence_missing",
      );
    }

    if (
      evidence.type !==
      "conversation"
    ) {
      throw new Error(
        "genesis_conversation_replay_evidence_type_mismatch",
      );
    }

    if (
      evidence.checksum !==
      request.manifestEntry.sourceChecksum
    ) {
      throw new Error(
        "genesis_conversation_replay_evidence_checksum_mismatch",
      );
    }

    if (
      evidence.metadata.historicalSourceId !==
      request.manifestEntry.historicalSourceId
    ) {
      throw new Error(
        "genesis_conversation_replay_evidence_source_identity_mismatch",
      );
    }

    if (
      evidence.contentRef !==
      request.manifestEntry.provenanceLocator
    ) {
      throw new Error(
        "genesis_conversation_replay_evidence_provenance_mismatch",
      );
    }

    if (
      evidence.observedAt !==
      request.manifestEntry.historicalTimestamp
    ) {
      throw new Error(
        "genesis_conversation_replay_evidence_timestamp_mismatch",
      );
    }

    return evidence;
  }


  private reviewedManufacturingFor(
    request:
      GenesisReplayAdmissionRequest,
  ):
    GenesisProductionReplayReviewedManufacturingRequest |
    null {
    if (
      !this.reviewedManufacturing
    ) {
      return null;
    }

    if (
      this.reviewedManufacturing
        .historicalSourceId !==
      request.planEntry
        .historicalSourceId
    ) {
      return null;
    }

    return this.reviewedManufacturing;
  }


  private reprocessingFor(
    request:
      GenesisReplayAdmissionRequest,
  ):
    GenesisProductionReplayReprocessingRequest |
    null {
    if (
      !this.reprocessing
    ) {
      return null;
    }

    if (
      this.reprocessing
        .historicalSourceId !==
      request.planEntry
        .historicalSourceId
    ) {
      return null;
    }

    return this.reprocessing;
  }


  async admit(
    request:
      GenesisReplayAdmissionRequest,
  ): Promise<
    GenesisReplayAdmissionResult
  > {
    assertProductionAdmissionRequest(
      request,
    );

    const evidence =
      this.evidenceFor(
        request,
      );

    const baseGovernance =
      classifyGenesisHistoricalAdmission(
        request.manifestEntry,
      );

    const existing =
      evidenceRun(
        this.platform,
        evidence.id,
      );

    const reprocessing =
      this.reprocessingFor(
        request,
      );


    const reviewedManufacturing =
      this.reviewedManufacturingFor(
        request,
      );

    if (
      existing &&
      !reprocessing
    ) {
      return existingAdmissionResult(
        existing,
        evidence,
      );
    }

    if (
      reviewedManufacturing
    ) {
      if (existing) {
        throw new Error(
          "genesis_reviewed_manufacturing_existing_run_not_allowed",
        );
      }

      const review =
        this.historicalEvidenceReviewDecisionResolver
          ?.resolve(
            request.manifestEntry
              .historicalSourceId,
            evidence.id,
          ) ??
        null;

      if (!review) {
        throw new Error(
          "genesis_reviewed_manufacturing_decision_required",
        );
      }

      const reviewedManifestEntry =
        manifestEntryWithHistoricalEvidenceReview(
          request.manifestEntry,
          evidence.id,
          review,
        );

      const reviewedGovernance =
        classifyGenesisHistoricalAdmission(
          reviewedManifestEntry,
        );

      if (
        !reviewedGovernance
          .invokeKnowledgeManufacturing
      ) {
        throw new Error(
          "genesis_reviewed_manufacturing_not_authorized",
        );
      }

      /*
       * The persisted historical Evidence and manifest remain immutable.
       *
       * For an explicitly approved reviewed-manufacturing transition,
       * carry the effective governance decision into the transient
       * Evidence metadata consumed by Knowledge Manufacturing.
       *
       * Documentation validators require owner/scope/version and the
       * literal approved state. These values come from the persisted
       * human review decision, not from rewriting historical truth.
       */
      const reviewedEvidence = {
        ...evidence,

        metadata: {
          ...evidence.metadata,

          approvalState:
            review.authority
              ?.approvalState,

          owner:
            review.authority
              ?.authorityOwner,

          scope:
            review.authority
              ?.authorityScope,

          version:
            review.authority
              ?.authorityVersion,

          authorityClass:
            review.authority
              ?.authorityClass,

          authorityOwner:
            review.authority
              ?.authorityOwner,

          authorityScope:
            review.authority
              ?.authorityScope,

          authorityVersion:
            review.authority
              ?.authorityVersion,

          historicalEvidenceReviewDecisionId:
            review.decisionId,

          historicalEvidenceReviewReviewerId:
            review.reviewerId,

          historicalEvidenceReviewDecidedAt:
            review.decidedAt,
        },
      };

      await this.platform
        .preserve(
          reviewedEvidence,
        );

      const manufacturedRun =
        evidenceRun(
          this.platform,
          evidence.id,
        );

      if (!manufacturedRun) {
        throw new Error(
          "genesis_reviewed_manufacturing_run_missing_after_preserve",
        );
      }

      return existingAdmissionResult(
        manufacturedRun,
        evidence,
      );
    }


    if (
      reprocessing
    ) {
      const resolvedReview =
        this.historicalEvidenceReviewDecisionResolver
          ?.resolve(
            request.manifestEntry
              .historicalSourceId,
            evidence.id,
          ) ??
        null;

      let effectiveGovernance =
        baseGovernance;

      if (
        !effectiveGovernance
          .invokeKnowledgeManufacturing &&
        resolvedReview
      ) {
        const reviewedManifestEntry =
          manifestEntryWithHistoricalEvidenceReview(
            request.manifestEntry,
            evidence.id,
            resolvedReview,
          );

        effectiveGovernance =
          classifyGenesisHistoricalAdmission(
            reviewedManifestEntry,
          );
      }

      if (
        !effectiveGovernance
          .invokeKnowledgeManufacturing
      ) {
        throw new Error(
          "genesis_reprocessing_requires_knowledge_manufacturing_eligibility",
        );
      }

      if (
        !resolvedReview
      ) {
        throw new Error(
          "genesis_reprocessing_review_decision_required",
        );
      }

      /*
       * Remediation must consume the same effective human-review
       * authority as reviewed first manufacturing.
       *
       * Persisted historical Evidence remains immutable.
       */
      const reviewedReprocessingEvidence = {
        ...evidence,

        metadata: {
          ...evidence.metadata,

          approvalState:
            resolvedReview?.authority
              ?.approvalState,

          owner:
            resolvedReview?.authority
              ?.authorityOwner,

          scope:
            resolvedReview?.authority
              ?.authorityScope,

          version:
            resolvedReview?.authority
              ?.authorityVersion,

          authorityClass:
            resolvedReview?.authority
              ?.authorityClass,

          authorityOwner:
            resolvedReview?.authority
              ?.authorityOwner,

          authorityScope:
            resolvedReview?.authority
              ?.authorityScope,

          authorityVersion:
            resolvedReview?.authority
              ?.authorityVersion,

          historicalEvidenceReviewDecisionId:
            resolvedReview?.decisionId,

          historicalEvidenceReviewReviewerId:
            resolvedReview?.reviewerId,

          historicalEvidenceReviewDecidedAt:
            resolvedReview?.decidedAt,
        },
      };

      await this.platform
        .reprocess(
          reviewedReprocessingEvidence,
          {
            attemptId:
              reprocessing
                .attemptId,

            priorManufacturingRunId:
              reprocessing
                .priorManufacturingRunId,

            priorPackageId:
              reprocessing
                .priorPackageId,

            reason:
              reprocessing
                .reason,
          },
        );

      return {
        evidenceId:
          evidence.id,
      };
    }

    /*
     * Historical Evidence admission and Knowledge manufacturing
     * remain separate trust transitions.
     *
     * Conversation Evidence is admitted using its original
     * acquisition custody. It is never reconstructed from the
     * replay manifest.
     */
    if (
      !baseGovernance.invokeKnowledgeManufacturing
    ) {
      /*
       * Evidence identity is deterministic for immutable historical
       * source content, while Genesis replay metadata is execution-
       * specific.
       *
       * A later replay may therefore resolve the same Evidence ID
       * with different replay metadata. Existing immutable Evidence
       * must be reused rather than overwritten.
       *
       * Checksum mismatch remains a fail-closed integrity violation.
       */
      const existingEvidence =
        this.evidencePersistenceStore.load(
          evidence.id,
        );

      if (
        existingEvidence
      ) {
        if (
          existingEvidence.id !==
            evidence.id ||
          existingEvidence.checksum !==
            evidence.checksum
        ) {
          throw new Error(
            "genesis_evidence_persistence_integrity_mismatch",
          );
        }

        return {
          evidenceId:
            existingEvidence.id,
        };
      }

      this.evidencePersistenceStore.save(
        evidence,
      );

      const persistedEvidence =
        this.evidencePersistenceStore.load(
          evidence.id,
        );

      if (
        !persistedEvidence
      ) {
        throw new Error(
          "genesis_evidence_persistence_missing_after_save",
        );
      }

      if (
        persistedEvidence.id !==
          evidence.id ||
        persistedEvidence.checksum !==
          evidence.checksum
      ) {
        throw new Error(
          "genesis_evidence_persistence_integrity_mismatch",
        );
      }

      return {
        evidenceId:
          persistedEvidence.id,
      };
    }

    try {
      await this.platform.preserve(
        evidence,
      );
    } catch (
      error
    ) {
      const afterFailure =
        evidenceRun(
          this.platform,
          evidence.id,
        );

      if (
        afterFailure &&
        evidenceIntakeCompleted(
          afterFailure,
        )
      ) {
        return {
          evidenceId:
            evidence.id,
        };
      }

      throw error;
    }

    const admittedRun =
      evidenceRun(
        this.platform,
        evidence.id,
      );

    if (
      !admittedRun
    ) {
      throw new Error(
        "genesis_production_admission_manufacturing_run_missing",
      );
    }

    return existingAdmissionResult(
      admittedRun,
      evidence,
    );
  }
}
