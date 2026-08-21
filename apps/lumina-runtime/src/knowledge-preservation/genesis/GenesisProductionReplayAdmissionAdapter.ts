import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  KnowledgeManufacturingRun,
} from "../manufacturing/index.js";

import type {
  KnowledgePreservationPlatform,
} from "../bootstrap/index.js";

import type {
  GenesisReplayAdmissionAdapter,
  GenesisReplayAdmissionRequest,
  GenesisReplayAdmissionResult,
} from "./GenesisReplayExecution.js";

import {
  genesisReplayAdmissionRequestToEvidence,
} from "./GenesisReplayAdmission.js";

import {
  classifyGenesisHistoricalAdmission,
} from "./GenesisHistoricalAdmissionGovernancePolicy.js";


export interface GenesisProductionReplayAdmissionAdapterOptions {
  platform:
    KnowledgePreservationPlatform;
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
      (
        run,
      ) =>
        run.evidenceId ===
        evidenceId,
    );
}

function evidenceIntakeCompleted(
  run:
    KnowledgeManufacturingRun,
): boolean {
  return run.stageHistory.some(
    (
      event,
    ) =>
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
    request.manifestEntry
      .replayEligibility !==
    "eligible"
  ) {
    throw new Error(
      "genesis_production_admission_requires_eligible_source",
    );
  }

  if (
    request.planEntry
      .historicalSourceId !==
    request.manifestEntry
      .historicalSourceId
  ) {
    throw new Error(
      "genesis_production_admission_source_identity_mismatch",
    );
  }

  if (
    request.planEntry
      .sourceChecksum !==
    request.manifestEntry
      .sourceChecksum
  ) {
    throw new Error(
      "genesis_production_admission_source_checksum_mismatch",
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

  constructor(
    options:
      GenesisProductionReplayAdmissionAdapterOptions,
  ) {
    this.platform =
      options.platform;
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
      genesisReplayAdmissionRequestToEvidence(
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

    if (
      existing
    ) {
      return existingAdmissionResult(
        existing,
        evidence,
      );
    }

    /*
     * Genesis Evidence admission and Knowledge manufacturing
     * are separate trust transitions.
     *
     * The Replay manifest plus deterministic Evidence identity
     * and persisted ADMITTED checkpoint disposition preserve
     * historical existence. Only sources classified as
     * knowledge-seeding-eligible may enter the existing
     * Knowledge Operations manufacturing pipeline.
     *
     * No classification here grants canonical authority.
     */
    if (
      !governance
        .invokeKnowledgeManufacturing
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
      /*
       * preserve() governs more than Evidence Intake.
       *
       * If Evidence Intake completed before a later
       * manufacturing stage failed, Genesis admission itself
       * succeeded. The downstream Knowledge Operations run
       * remains the authoritative record of that later failure.
       *
       * If Evidence Intake never completed, propagate the
       * original failure and do not mark Genesis ADMITTED.
       */
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
