import type {
  EvidenceItem,
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
  GenesisConversationReplayEvidenceResolver,
} from "./GenesisConversationReplayEvidenceResolver.js";


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

    const governance =
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
      reprocessing
    ) {
      if (
        !governance
          .invokeKnowledgeManufacturing
      ) {
        throw new Error(
          "genesis_reprocessing_requires_knowledge_manufacturing_eligibility",
        );
      }

      await this.platform
        .reprocess(
          evidence,
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
      !governance.invokeKnowledgeManufacturing
    ) {
      return {
        evidenceId:
          evidence.id,
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
