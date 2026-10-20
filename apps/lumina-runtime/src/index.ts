import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  registerRuntimeScenarioRoute,
} from "./routes/runtimeScenario.js";

import express from "express";
import cors from "cors";
import {
  ChiefAgentActivationGate,
  ChiefAgentActivationService,
  FileChiefAgentActivationStore,
  requireActiveChiefAgent,
} from "./executive/activation/index.js";
import {
  registerExecutiveActivationRoute,
} from "./routes/executiveActivation.js";
import {
  rejectAgentActorsOnHumanOnlyExecutiveRoutes,
  rejectDisallowedBrowserOrigins,
  resolveAllowedRuntimeOrigins,
  resolveRuntimeHost,
} from "./routes/runtimeBoundary.js";
import {
  requireRuntimeAccess,
} from "./routes/runtimeAccess.js";
import {
  ContinuousLearningCycleService,
  ContinuousLearningScheduler,
  FileContinuousLearningLedger,
  GitLearningWindowSource,
  FileLearningPromotionAuthorizationStore,
  LEARNING_RECORD_AUTHORITY,
  LEARNING_RECORD_SCOPE,
  LEARNING_REVIEW_POLICY_ID,
  LEARNING_REVIEW_POLICY_VERSION,
  validateStandingLearningPromotionAuthorization,
  LearningEvidenceCollector,
  LearningRecordService,
  LearningRecordSynthesizer,
  LearningRecordWriter,
  resolveLearningIntervalMinutes,
  windowedGenesisManifestBuilder,
} from "./continuous-learning/index.js";
import {
  createTextGenerationClient,
  resolveChiefAgentReasoningRouting,
} from "./executive/reasoning/index.js";
import {
  resolveExecutiveStorageRoot,
} from "./executive/storage/resolveExecutiveStorageRoot.js";
import {
  registerContinuousLearningRoutes,
  registerLearningGovernanceRoutes,
} from "./routes/continuousLearning.js";
import {
  runGovernedGenesisReplay,
} from "./knowledge-preservation/genesis/index.js";
import {
  classifyCanonicalReview,
  loadCanonicalReviewPolicy,
} from "./knowledge-preservation/review/index.js";
import {
  cacheUntilRuntimeStateChanges,
  trackRuntimeMutations,
} from "./runtime/cache/RuntimeStateCache.js";
import type {
  RuntimeStateRoot,
} from "./runtime/cache/RuntimeStateCache.js";
import {
  resolveKnowledgeStorageRoot,
  resolveRepositoryRoot,
} from "./knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

import { registerProjectsRoute } from "./routes/projects.js";
import { registerProjectMetadataRoute } from "./routes/projectMetadata.js";
import { registerImportProjectRoute } from "./routes/importProject.js";
import { registerStartRoute } from "./routes/start.js";
import { registerStatusRoute } from "./routes/status.js";
import { registerStopRoute } from "./routes/stop.js";
import { registerRestartRoute } from "./routes/restart.js";
import { registerLogsRoute } from "./routes/logs.js";
import { registerMetricsRoute } from "./routes/metrics.js";
import { registerEventsRoute } from "./routes/events.js";
import { registerFsRoute } from "./routes/fs.js";
import { registerAuditRoute } from "./routes/audit.js";
import { registerFixPlanRoute } from "./routes/fixPlan.js";
import { registerGenerateFixesRoute } from "./routes/generateFixes.js";
import { registerDraftsRoute } from "./routes/drafts.js";
import { registerRevertDraftRoute } from "./routes/revertDraft.js";
import { registerCreateDraftRoute } from "./routes/createDraft.js";
import { registerApplyDraftRoute } from "./routes/applyDraft.js";
import { registerKnowledgeOperationsRoutes } from "./routes/knowledge/registerKnowledgeOperationsRoutes.js";
import {
  KnowledgeOperationsService,
} from "./knowledge-operations/KnowledgeOperationsService.js";
import { registerCanonicalReviewRoutes } from "./routes/knowledge/registerCanonicalReviewRoutes.js";
import { registerCanonicalReviewPolicyRoutes } from "./routes/knowledge/registerCanonicalReviewPolicyRoutes.js";
import { registerCanonicalReviewPolicyAdministrationRoutes } from "./routes/knowledge/registerCanonicalReviewPolicyAdministrationRoutes.js";
import { registerCanonicalReviewPolicyExecutionRoutes } from "./routes/knowledge/registerCanonicalReviewPolicyExecutionRoutes.js";
import { registerCanonicalReviewPolicyBindingRoutes } from "./routes/knowledge/registerCanonicalReviewPolicyBindingRoutes.js";
import { registerCanonicalReviewBatchRoutes } from "./routes/knowledge/registerCanonicalReviewBatchRoutes.js";
import { registerCanonicalPromotionRoutes } from "./routes/knowledge/registerCanonicalPromotionRoutes.js";
import { registerAutonomousCanonicalPromotionRoutes } from "./routes/knowledge/registerAutonomousCanonicalPromotionRoutes.js";
import { registerAutonomousGovernanceCycleRoutes } from "./routes/knowledge/registerAutonomousGovernanceCycleRoutes.js";
import { registerLegacyHistoricalReconciliationRoutes } from "./routes/knowledge/registerLegacyHistoricalReconciliationRoutes.js";
import { registerOrganizationalMemoryAdaptationRoutes } from "./routes/knowledge/registerOrganizationalMemoryAdaptationRoutes.js";
import { registerKnowledgeProductionLifecycleRoutes } from "./routes/knowledge/registerKnowledgeProductionLifecycleRoutes.js";
import { registerKnowledgePreservationRoutes } from "./routes/knowledge/registerKnowledgePreservationRoutes.js";
import { registerExecutiveRoute } from "./routes/executive.js";
import { resolveRuntimeCaller } from "./routes/runtimeCaller.js";
import { registerRuntimeIdentityRoute } from "./routes/runtimeIdentity.js";
import {
  SupabaseAccessTokenVerifier,
  supabaseTokenConfigFromEnvironment,
} from "./routes/supabaseAccessToken.js";
import { registerExecutiveReasoningRoute } from "./routes/executiveReasoning.js";
import { registerExecutiveOperationsSnapshotRoute } from "./routes/executiveOperationsSnapshot.js";
import { registerExecutiveOperationalStateRoute } from "./routes/executiveOperationalState.js";
import { registerExecutiveDecisionRoute } from "./routes/executiveDecision.js";
import { registerExecutiveDelegationRoute } from "./routes/executiveDelegation.js";
import { registerExecutiveActionRoute } from "./routes/executiveAction.js";
import { registerExecutiveActionExecutionRoute } from "./routes/executiveActionExecution.js";
import { registerExecutiveActionMutationRoute } from "./routes/executiveActionMutation.js";
import { registerExecutiveApprovalRoute } from "./routes/executiveApproval.js";

import {
  runtimeKnowledgeProvider,
  rehydrateRuntimeCanonicalKnowledge,
  RuntimeOrganizationalMemoryProvider,
  RuntimeOrganizationalMemoryStore,
} from "./knowledge-platform/runtime/index.js";

import {
  GovernedCanonicalMemoryAdaptationService,
  registerOrganizationalMemoryProvider,
} from "./knowledge/organizational-memory/index.js";

import {
  KnowledgeContextBuilder,
} from "./knowledge-platform/context/index.js";

import {
  CanonicalReviewBatchService,
  CanonicalReviewPolicyAdministrationService,
  CanonicalReviewPolicyBindingService,
  CanonicalReviewPolicyExecutionService,
  CanonicalReviewService,
} from "./knowledge-preservation/review/index.js";

import {
  AutonomousGovernedCanonicalPromotionExecutor,
  GovernedCanonicalPromotionService,
} from "./knowledge-preservation/promotion/index.js";

import {
  AutonomousGovernanceCycleOrchestrator,
  LegacyHistoricalReconciliationOrchestrator,
  LegacyHistoricalReconciliationService,
  VerifiedGenesisHistoricalCorrelationResolver,
  DelegatingGovernanceReadySignalPublisher,
  GovernanceReadyRecoveryScheduler,
  GovernanceReadyRecoverySweep,
  GovernanceReadyRuntimeConsumer,
} from "./knowledge-preservation/governance/index.js";

import {
  createKnowledgePreservationPlatform,
} from "./knowledge-preservation/bootstrap/index.js";

import {
  ChiefAgentProductionWorkspaceAuthorizationService,
  EducationalCorpusCertificationService,
  EducationalCorpusRuntimeService,
  FileChiefAgentProductionWorkspaceAuthorizationPersistenceStore,
  FileEducationalCorpusCertificationPersistenceStore,
  FileEducationalCorpusPersistenceStore,
  FileInitialCompetencyCertificationPersistenceStore,
  FileInitialCompetencyEvidencePersistenceStore,
  FileInitialCompetencyHumanAcceptancePersistenceStore,
  InitialCompetencyAssessmentService,
  InitialCompetencyCertificationService,
  InitialCompetencyEvidenceValidationService,
  InitialCompetencyHumanAcceptanceService,
  KnowledgeEducationProjectionService,
} from "./knowledge-education/index.js";

import {
  registerKnowledgeEducationRoutes,
} from "./routes/knowledge/registerKnowledgeEducationRoutes.js";

import {
  registerGovernedRetrievalObservationRoute,
} from "./routes/knowledge/registerGovernedRetrievalObservationRoute.js";

import {
  createExecutiveOrchestrator,
} from "./executive/orchestrator/index.js";

import {
  ChiefAgentReasoningDecisionService,
  ChiefAgentReasoningDestinationAdapter,
  ChiefAgentReasoningExecutionService,
  ChiefAgentReasoningKnowledgeMaterializer,
  ChiefAgentGovernedContentReader,
  ChiefAgentOperationalStateReader,
  ExecutiveReasoningService,
  FileExecutiveReasoningStore,
  createChiefAgentReasoningProvider,
} from "./executive/reasoning/index.js";

import {
  ExecutiveApprovalDecisionService,
  ExecutiveApprovalService,
  ExecutiveDecisionApprovalRequestService,
} from "./executive/approval/index.js";

import {
  ExecutiveDecisionDelegationService,
  ExecutiveDelegationService,
} from "./executive/delegation/index.js";

import {
  configureExecutiveActionExecutorComposition,
  ExecutiveActionExecutionAuthorizationService,
  ExecutiveActionExecutionDispatcher,
  ExecutiveActionExecutionOutcomeService,
  ExecutiveActionExecutionStartService,
  ExecutiveActionExecutorPolicyRegistry,
  ExecutiveActionExecutorRegistry,
  ExecutiveActionService,
  ExecutiveDecisionActionProposalService,
  ExecutiveDelegationActionProposalService,
  ExecutiveDelegationActionReadinessService,
} from "./executive/action/index.js";

import {
  ExecutiveAuditService,
} from "./executive/audit/index.js";

import {
  ExecutiveDecisionService,
} from "./executive/decision/index.js";

import { stopAllRuntimes } from "./runtime/registry.js";
import {
  startRuntimeSupervisor,
  stopRuntimeSupervisor,
} from "./runtime/supervisor.js";
import { recoverPersistedRuntimes } from "./runtime/recovery.js";
import { claimRuntimeBootstrap } from "./runtime/bootstrapGuard.js";
import { stopAllWorkspaceWatchers } from "./runtime/workspaceWatcher.js";
import { backfillMissingProjectMetadata } from "./projects/projectMetadataMigration.js";

import {
  getRuntimeDataRoot,
} from "./projects/workspacePaths.js";



import {
  registerKnowledgeManufacturingReplayRoutes,
} from "./routes/knowledge/registerKnowledgeManufacturingReplayRoutes.js";

import {
  registerGenesisReplayStatusRoute,
} from "./routes/genesisReplayStatus.js";

import {
  registerGenesisReplayDesignationRoute,
} from "./routes/genesisReplayDesignation.js";

import {
  registerGenesisReplayInventoryRoute,
} from "./routes/genesisReplayInventory.js";

import {
  registerGenesisOperationalProjectionRoute,
} from "./routes/genesisOperationalProjection.js";

import {
  registerGenesisReplayExecutionRoute,
} from "./routes/genesisReplayExecution.js";


import {
  registerGenesisConversationAcquisitionRoutes,
} from "./routes/genesisConversationAcquisition.js";


import {
  registerGenesisConversationExpectedHistoryCandidateRoutes,
} from "./routes/genesisConversationExpectedHistoryCandidate.js";

import {
  registerGenesisConversationExpectedHistoryCandidateReviewRoutes,
} from "./routes/genesisConversationExpectedHistoryCandidateReview.js";

import {
  registerGenesisConversationAuthoritativeCompletenessEvidenceRoute,
} from "./routes/genesisConversationAuthoritativeCompletenessEvidence.js";

import {
  registerGenesisConversationAuthoritativeCompletenessCertificationRoutes,
} from "./routes/genesisConversationAuthoritativeCompletenessCertification.js";



import {
  registerGenesisConversationExpectedHistoryRoutes,
} from "./routes/genesisConversationExpectedHistory.js";

import {
  registerGenesisConversationAuthoritativeExpectedHistoryRoute,
} from "./routes/genesisConversationAuthoritativeExpectedHistory.js";

import {
  registerGenesisConversationExpectedHistoryAmendmentRoute,
} from "./routes/genesisConversationExpectedHistoryAmendment.js";


import {
  registerGenesisDayZeroCertificationRoutes,
} from "./routes/genesisDayZeroCertification.js";


import {
  knowledgeManufacturingReplayService,
} from "./knowledge-preservation/manufacturing/index.js";

import {
  buildGenesisRuntimeCanonicalConsumptionView,
  buildGenesisDayZeroGovernedCertificationCandidate,
  FileGenesisConversationAcquisitionPersistenceStore,
  FileGenesisConversationExpectedHistoryCandidatePersistenceStore,
  FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore,
  FileGenesisConversationExpectedHistoryPersistenceStore,
  FileGenesisConversationExpectedHistoryAmendmentPersistenceStore,
  GenesisConversationExpectedHistoryAmendmentService,
  GenesisConversationExpectedHistoryCandidateReviewService,
  GenesisConversationExpectedHistoryCandidateService,
  GenesisConversationAuthoritativeCompletenessEvidenceService,
  FileGenesisConversationAuthoritativeCompletenessCertificationPersistenceStore,
  GenesisConversationAuthoritativeCompletenessCertificationService,
  FileGenesisDayZeroCertificationPersistenceStore,
  GenesisConversationAcquisitionExecutor,
  GenesisConversationHistoryReconciliationService,
  GenesisConversationAuthoritativeExpectedHistoryService,
  GenesisDayZeroCertificationService,
  GenesisCurrentPolicyOrganizationalMemoryView,
  PersistedConversationHistoricalSourceDiscoverer,
  PersistedGenesisConversationReplayEvidenceResolver,
  resolveGenesisConversationRuntimeConfiguration,
  FileGenesisHistoricalCorrelationPersistenceStore,
  FileGenesisReplayPersistenceStore,
  FileGenesisRuntimeReplayDesignationStore,
  listGenesisReplayInventory,
  readGenesisOperationalProjection,
  resolveGenesisRuntimeReplaySelection,
} from "./knowledge-preservation/genesis/index.js";
import { GenesisDayZeroConversationCoverageEvidenceService } from "./knowledge-preservation/genesis/GenesisDayZeroConversationCoverageEvidenceService.js";
import { GenesisDayZeroConversationCoverageCertificationService } from "./knowledge-preservation/genesis/GenesisDayZeroConversationCoverageCertificationService.js";
import { FileGenesisDayZeroConversationCoverageCertificationPersistenceStore } from "./knowledge-preservation/genesis/GenesisDayZeroConversationCoverageCertificationPersistence.js";
import {
  registerGenesisDayZeroConversationCoverageCertificationRoutes,
} from "./routes/genesisDayZeroConversationCoverageCertification.js";

const app = express();

const knowledgePlatform =
  runtimeKnowledgeProvider.getPlatform();

export const runtimeGovernanceReadySignalPublisher =
  new DelegatingGovernanceReadySignalPublisher();

export const runtimeKnowledgePreservationPlatform =
  createKnowledgePreservationPlatform(
    runtimeGovernanceReadySignalPublisher,
  );

export const runtimeGenesisReplayPersistenceStore =
  new FileGenesisReplayPersistenceStore();

export const runtimeGenesisHistoricalCorrelationPersistenceStore =
  new FileGenesisHistoricalCorrelationPersistenceStore();

export const runtimeGenesisReadinessPolicy = {
  policyId:
    "korelumina-genesis-readiness:v1",

  requiredSourceClasses: [
    "architecture-document",
    "commit",
    "conversation",
  ],
} as const;


export const runtimeGenesisConversationConfiguration =
  resolveGenesisConversationRuntimeConfiguration();


export const runtimeGenesisConversationAcquisitionPersistenceStore =
  new FileGenesisConversationAcquisitionPersistenceStore();


export const runtimeGenesisConversationAcquisitionExecutor =
  new GenesisConversationAcquisitionExecutor({
    configuration:
      runtimeGenesisConversationConfiguration,

    persistence:
      runtimeGenesisConversationAcquisitionPersistenceStore,

    repository:
      "korelumina",
  });


export const runtimeGenesisPersistedConversationHistoricalSourceDiscoverer =
  new PersistedConversationHistoricalSourceDiscoverer({
    acquisition:
      runtimeGenesisConversationAcquisitionPersistenceStore,
  });


export const runtimeGenesisConversationReplayEvidenceResolver =
  new PersistedGenesisConversationReplayEvidenceResolver({
    acquisition:
      runtimeGenesisConversationAcquisitionPersistenceStore,
  });


export const runtimeGenesisConversationExpectedHistoryCandidatePersistenceStore =
  new FileGenesisConversationExpectedHistoryCandidatePersistenceStore();


export const runtimeGenesisConversationExpectedHistoryCandidateService =
  new GenesisConversationExpectedHistoryCandidateService(
    runtimeGenesisConversationAcquisitionPersistenceStore,
    runtimeGenesisConversationExpectedHistoryCandidatePersistenceStore,
  );


export const runtimeGenesisConversationExpectedHistoryCandidateReviewPersistenceStore =
  new FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore();

export const runtimeGenesisConversationExpectedHistoryCandidateReviewService =
  new GenesisConversationExpectedHistoryCandidateReviewService(
    runtimeGenesisConversationExpectedHistoryCandidateService,
    runtimeGenesisConversationExpectedHistoryCandidateReviewPersistenceStore,
  );

export const runtimeGenesisConversationExpectedHistoryPersistenceStore =
  new FileGenesisConversationExpectedHistoryPersistenceStore();


export const runtimeGenesisConversationHistoryReconciliationService =
  new GenesisConversationHistoryReconciliationService(
    runtimeGenesisConversationConfiguration,
    runtimeGenesisConversationAcquisitionExecutor,
    runtimeGenesisConversationExpectedHistoryPersistenceStore,
  );


export const runtimeGenesisConversationExpectedHistoryAmendmentPersistenceStore =
  new FileGenesisConversationExpectedHistoryAmendmentPersistenceStore();


export const runtimeGenesisConversationExpectedHistoryAmendmentService =
  new GenesisConversationExpectedHistoryAmendmentService(
    runtimeGenesisConversationHistoryReconciliationService,
    runtimeGenesisConversationExpectedHistoryAmendmentPersistenceStore,
  );




export const runtimeGenesisConversationAuthoritativeCompletenessEvidenceService =
  new GenesisConversationAuthoritativeCompletenessEvidenceService(
    runtimeGenesisConversationExpectedHistoryCandidateService,
    runtimeGenesisConversationExpectedHistoryCandidateReviewService,
    runtimeGenesisConversationHistoryReconciliationService,
  );


export const runtimeGenesisConversationAuthoritativeCompletenessCertificationPersistenceStore =
  new FileGenesisConversationAuthoritativeCompletenessCertificationPersistenceStore();

export const runtimeGenesisConversationAuthoritativeCompletenessCertificationService =
  new GenesisConversationAuthoritativeCompletenessCertificationService(
    runtimeGenesisConversationAuthoritativeCompletenessCertificationPersistenceStore,
    runtimeGenesisConversationAuthoritativeCompletenessEvidenceService,
  );


export const runtimeGenesisConversationAuthoritativeExpectedHistoryService =
  new GenesisConversationAuthoritativeExpectedHistoryService(
    runtimeGenesisConversationExpectedHistoryCandidateService,
    runtimeGenesisConversationAuthoritativeCompletenessCertificationService,
    runtimeGenesisConversationHistoryReconciliationService,
  );


export const runtimeGenesisDayZeroCertificationPersistenceStore =
  new FileGenesisDayZeroCertificationPersistenceStore();


export const runtimeGenesisReplayDesignationStore =
  new FileGenesisRuntimeReplayDesignationStore();

export const runtimeGenesisReplayInventory =
  listGenesisReplayInventory({
    persistence:
      runtimeGenesisReplayPersistenceStore,

    manufacturingRuns:
      runtimeKnowledgePreservationPlatform
        .manufacturingRunService,
  });

export const runtimeGenesisReplaySelection =
  resolveGenesisRuntimeReplaySelection({
    designationStore:
      runtimeGenesisReplayDesignationStore,

    inventory:
      runtimeGenesisReplayInventory,
  });

rehydrateRuntimeCanonicalKnowledge(
  knowledgePlatform,
);

export const runtimeOrganizationalMemoryStore =
  new RuntimeOrganizationalMemoryStore();

/*
 * Every persisted location Genesis, knowledge, and education reads from.
 * Project workspaces and test data are not knowledge state.
 */
function runtimeKnowledgeStateRoots(): RuntimeStateRoot[] {
  const roots: RuntimeStateRoot[] = [
    {
      root: getRuntimeDataRoot(),
      exclude: ["test-knowledge"],
    },
    {
      root: resolveKnowledgeStorageRoot(),
    },
  ];
  for (const name of [
    "KORELUMINA_CANONICAL_ROOT",
    "KORELUMINA_GENESIS_CHATGPT_EXPORT_ROOT",
    "KORELUMINA_GENESIS_CHATGPT_BROWSER_RECOVERY_ROOT",
  ]) {
    const value = process.env[name]?.trim();
    if (value) roots.push({ root: value });
  }
  return roots;
}

export const runtimeGenesisDayZeroCertificationService =
  new GenesisDayZeroCertificationService(
    runtimeGenesisDayZeroCertificationPersistenceStore,
    {
      /*
       * RT-1: rebuilding this candidate reads every persisted Genesis
       * replay (about 12 s). It is reused until Runtime state changes.
       */
      readCurrentCandidate:
        cacheUntilRuntimeStateChanges(() => {
          const inventory =
            listGenesisReplayInventory({
              persistence:
                runtimeGenesisReplayPersistenceStore,

              manufacturingRuns:
                runtimeKnowledgePreservationPlatform
                  .manufacturingRunService,
            });

          const selection =
            resolveGenesisRuntimeReplaySelection({
              designationStore:
                runtimeGenesisReplayDesignationStore,

              inventory,
            });

          if (
            selection.state !==
              "SELECTED" ||
            selection.replayId ===
              null
          ) {
            throw new Error(
              "genesis_day_zero_certification_runtime_replay_not_selected",
            );
          }

          const operationalProjection =
            readGenesisOperationalProjection({
              replayId:
                selection.replayId,

              replayPersistence:
                runtimeGenesisReplayPersistenceStore,

              historicalCorrelation:
                runtimeGenesisHistoricalCorrelationPersistenceStore,

              manufacturingRuns:
                runtimeKnowledgePreservationPlatform
                  .manufacturingRunService,

              organizationalMemory:
                runtimeOrganizationalMemoryStore,

              readinessPolicy:
                runtimeGenesisReadinessPolicy,

              conversationSource:
                runtimeGenesisConversationConfiguration
                  .boundary,

              conversationHistoryReconciliation:
                runtimeGenesisConversationHistoryReconciliationService
                  .read(),
            });

          const coverageCertification =
            runtimeGenesisDayZeroConversationCoverageCertificationService
              .read();

          return buildGenesisDayZeroGovernedCertificationCandidate({
            candidate:
              operationalProjection
                .dayZeroCertificationCandidate,

            conversationCoverageCertification: {
              state:
                coverageCertification.state,

              certificationId:
                coverageCertification
                  .certification
                  ?.certificationId ??
                null,
            },
          });
        }, {
          roots:
            runtimeKnowledgeStateRoots,
        }),
    },
  );

export const runtimeGovernedCanonicalMemoryAdaptationService =
  new GovernedCanonicalMemoryAdaptationService(
    runtimeOrganizationalMemoryStore,
  );

export const runtimeCanonicalReviewService =
  new CanonicalReviewService(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeKnowledgePreservationPlatform
      .manufacturingRunService,
  );

export const runtimeCanonicalReviewPolicyAdministrationService =
  new CanonicalReviewPolicyAdministrationService();

export const runtimeCanonicalReviewPolicyExecutionService =
  new CanonicalReviewPolicyExecutionService(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeCanonicalReviewService,
  );

export const runtimeCanonicalReviewPolicyBindingService =
  new CanonicalReviewPolicyBindingService(
    runtimeKnowledgePreservationPlatform
      .packageService,
  );

export const runtimeCanonicalReviewBatchService =
  new CanonicalReviewBatchService(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeCanonicalReviewService,
  );

export const runtimeGenesisOperationalProjection =
  runtimeGenesisReplaySelection.state ===
    "SELECTED" &&
  runtimeGenesisReplaySelection.replayId !==
    null
    ? (() => {
        try {
          return readGenesisOperationalProjection({
            replayId:
              runtimeGenesisReplaySelection.replayId,

            replayPersistence:
              runtimeGenesisReplayPersistenceStore,

            historicalCorrelation:
              runtimeGenesisHistoricalCorrelationPersistenceStore,

            manufacturingRuns:
              runtimeKnowledgePreservationPlatform
                .manufacturingRunService,

            organizationalMemory:
              runtimeOrganizationalMemoryStore,

            readinessPolicy:
              runtimeGenesisReadinessPolicy,

            conversationSource:
              runtimeGenesisConversationConfiguration
                .boundary,

            conversationHistoryReconciliation:
              runtimeGenesisConversationHistoryReconciliationService
                .read(),
          });
        } catch (
          error
        ) {
          console.error(
            "[genesis] designated replay operational projection unavailable",
            error,
          );

          return null;
        }
      })()
    : null;


export const runtimeGenesisCanonicalConsumption =
  buildGenesisRuntimeCanonicalConsumptionView({
    canonicalStore:
      knowledgePlatform.store,

    replaySelection:
      runtimeGenesisReplaySelection,

    historicalOutputGovernance:
      runtimeGenesisOperationalProjection
        ?.historicalOutputGovernance ??
      null,
  });


export const runtimeGenesisOrganizationalMemoryConsumption =
  new GenesisCurrentPolicyOrganizationalMemoryView(
    runtimeOrganizationalMemoryStore,

    runtimeGenesisCanonicalConsumption,
  );


export const runtimeOrganizationalMemoryProvider =
  new RuntimeOrganizationalMemoryProvider(
    runtimeGenesisOrganizationalMemoryConsumption,
  );


registerOrganizationalMemoryProvider(
  runtimeOrganizationalMemoryProvider,
);


export const runtimeKnowledgeEducationProjectionService =
  new KnowledgeEducationProjectionService(
    runtimeGenesisCanonicalConsumption
      .store,
  );


export const runtimeEducationalCorpusPersistenceStore =
  new FileEducationalCorpusPersistenceStore();


export const runtimeEducationalCorpusGenesisHistoricalReader = {
  read: () => {
    const inventory =
      listGenesisReplayInventory({
        persistence:
          runtimeGenesisReplayPersistenceStore,

        manufacturingRuns:
          runtimeKnowledgePreservationPlatform
            .manufacturingRunService,
      });

    const selection =
      resolveGenesisRuntimeReplaySelection({
        designationStore:
          runtimeGenesisReplayDesignationStore,

        inventory,
      });

    if (
      selection.state !==
        "SELECTED" ||
      selection.replayId ===
        null
    ) {
      return null;
    }

    return readGenesisOperationalProjection({
      replayId:
        selection.replayId,

      replayPersistence:
        runtimeGenesisReplayPersistenceStore,

      historicalCorrelation:
        runtimeGenesisHistoricalCorrelationPersistenceStore,

      manufacturingRuns:
        runtimeKnowledgePreservationPlatform
          .manufacturingRunService,

      organizationalMemory:
        runtimeOrganizationalMemoryStore,

      readinessPolicy:
        runtimeGenesisReadinessPolicy,

      conversationSource:
        runtimeGenesisConversationConfiguration
          .boundary,

      conversationHistoryReconciliation:
        runtimeGenesisConversationHistoryReconciliationService
          .read(),
    });
  },
};


export const runtimeGenesisDayZeroConversationCoverageEvidenceService =
  new GenesisDayZeroConversationCoverageEvidenceService(
    runtimeGenesisConversationHistoryReconciliationService,
    {
      read: () => {
        const operationalProjection =
          runtimeEducationalCorpusGenesisHistoricalReader
            .read();

        if (
          operationalProjection ===
          null
        ) {
          throw new Error(
            "genesis_day_zero_conversation_coverage_operational_projection_unavailable",
          );
        }

        return operationalProjection
          .conversationCorrelationCompleteness;
      },
    },
  );


export const runtimeGenesisDayZeroConversationCoverageCertificationPersistenceStore =
  new FileGenesisDayZeroConversationCoverageCertificationPersistenceStore();


export const runtimeGenesisDayZeroConversationCoverageCertificationService =
  new GenesisDayZeroConversationCoverageCertificationService(
    runtimeGenesisDayZeroConversationCoverageCertificationPersistenceStore,
    runtimeGenesisDayZeroConversationCoverageEvidenceService,
  );


export const runtimeEducationalCorpusService =
  new EducationalCorpusRuntimeService(
    runtimeEducationalCorpusPersistenceStore,
    runtimeKnowledgeEducationProjectionService,
    runtimeGenesisDayZeroCertificationService,
    runtimeEducationalCorpusGenesisHistoricalReader,
  );


export const runtimeEducationalCorpusCertificationPersistenceStore =
  new FileEducationalCorpusCertificationPersistenceStore();


export const runtimeEducationalCorpusCertificationService =
  new EducationalCorpusCertificationService(
    runtimeEducationalCorpusCertificationPersistenceStore,
    {
      readCurrentCandidate:
        () =>
          runtimeEducationalCorpusService
            .read()
            .certificationCandidate,
    },
  );

export const runtimeInitialCompetencyEvidencePersistenceStore =
  new FileInitialCompetencyEvidencePersistenceStore();


export const runtimeInitialCompetencyEvidenceValidationService =
  new InitialCompetencyEvidenceValidationService(
    runtimeInitialCompetencyEvidencePersistenceStore,
  );


export const runtimeInitialCompetencyAssessmentService =
  new InitialCompetencyAssessmentService(
    runtimeKnowledgeEducationProjectionService,
    runtimeEducationalCorpusCertificationService,
    runtimeInitialCompetencyEvidenceValidationService,
  );


export const runtimeInitialCompetencyCertificationPersistenceStore =
  new FileInitialCompetencyCertificationPersistenceStore();


export const runtimeInitialCompetencyCertificationService =
  new InitialCompetencyCertificationService(
    runtimeInitialCompetencyCertificationPersistenceStore,
    {
      readCurrentCandidate:
        () =>
          runtimeInitialCompetencyAssessmentService
            .read(),
    },
  );


export const runtimeInitialCompetencyHumanAcceptancePersistenceStore =
  new FileInitialCompetencyHumanAcceptancePersistenceStore();


export const runtimeInitialCompetencyHumanAcceptanceService =
  new InitialCompetencyHumanAcceptanceService(
    runtimeInitialCompetencyHumanAcceptancePersistenceStore,
    runtimeInitialCompetencyCertificationService,
  );


export const runtimeChiefAgentProductionWorkspaceAuthorizationPersistenceStore =
  new FileChiefAgentProductionWorkspaceAuthorizationPersistenceStore();


export const runtimeChiefAgentProductionWorkspaceAuthorizationService =
  new ChiefAgentProductionWorkspaceAuthorizationService(
    runtimeChiefAgentProductionWorkspaceAuthorizationPersistenceStore,
    runtimeInitialCompetencyHumanAcceptanceService,
  );


export const runtimeKnowledgeOperationsService =
  new KnowledgeOperationsService({
    packageService:
      runtimeKnowledgePreservationPlatform
        .packageService,

    manufacturingRunService:
      runtimeKnowledgePreservationPlatform
        .manufacturingRunService,

    canonicalStore:
      runtimeGenesisCanonicalConsumption
        .store,
  });


export const runtimeGovernedPromotionService =
  new GovernedCanonicalPromotionService(
    runtimeKnowledgePreservationPlatform
      .packageService,
    knowledgePlatform.store,
    runtimeKnowledgePreservationPlatform
      .manufacturingRunService,
  );

/*
 * ADR-0042 Decision 4 (CL-1d): the owner's standing authorization for
 * promoting Learning Records approved by the learning review policy.
 */
export const runtimeLearningPromotionAuthorizationStore =
  new FileLearningPromotionAuthorizationStore();

export const runtimeAutonomousGovernedPromotionExecutor =
  new AutonomousGovernedCanonicalPromotionExecutor(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeKnowledgePreservationPlatform
      .manufacturingRunService,
    runtimeGovernedPromotionService,
    (knowledgePackage, policyId, policyVersion) =>
      validateStandingLearningPromotionAuthorization(
        runtimeLearningPromotionAuthorizationStore,
        knowledgePackage,
        policyId,
        policyVersion,
      ),
  );

export const runtimeAutonomousGovernanceCycleOrchestrator =
  new AutonomousGovernanceCycleOrchestrator(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeCanonicalReviewPolicyBindingService,
    runtimeCanonicalReviewPolicyExecutionService,
    runtimeAutonomousGovernedPromotionExecutor,
  );

export const runtimeLegacyHistoricalReconciliationResolver =
  new VerifiedGenesisHistoricalCorrelationResolver(
    runtimeKnowledgePreservationPlatform
      .packageService,
  );

export const runtimeLegacyHistoricalReconciliationService =
  new LegacyHistoricalReconciliationService(
    runtimeKnowledgePreservationPlatform
      .packageService,
  );

export const runtimeLegacyHistoricalReconciliationOrchestrator =
  new LegacyHistoricalReconciliationOrchestrator(
    runtimeLegacyHistoricalReconciliationResolver,
    runtimeLegacyHistoricalReconciliationService,
  );


export const runtimeGovernanceReadyConsumer =
  new GovernanceReadyRuntimeConsumer(
    runtimeKnowledgePreservationPlatform
      .packageService,
    undefined,
    runtimeAutonomousGovernanceCycleOrchestrator,
    "runtime:autonomous-governance",
  );

runtimeGovernanceReadySignalPublisher
  .setDelegate(
    runtimeGovernanceReadyConsumer,
  );

export const runtimeGovernanceReadyRecoverySweep =
  new GovernanceReadyRecoverySweep(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeKnowledgePreservationPlatform
      .manufacturingRunService,
    runtimeGovernanceReadyConsumer,
  );

export const runtimeGovernanceReadyRecoveryScheduler =
  new GovernanceReadyRecoveryScheduler(
    runtimeGovernanceReadyRecoverySweep,
    {
      intervalMs:
        5 * 60 * 1000,

      runImmediately:
        true,

      onResult:
        (result) => {
          if (
            result.recovered >
              0 ||
            result.exceptions >
              0
          ) {
            console.log(
              "[knowledge-governance] recovery sweep",
              {
                scanned:
                  result.scanned,

                recoverable:
                  result.recoverable,

                recovered:
                  result.recovered,

                ignored:
                  result.ignored,

                exceptions:
                  result.exceptions,
              },
            );
          }
        },

      onError:
        (error) => {
          console.error(
            "[knowledge-governance] recovery sweep failed",
            error,
          );
        },
    },
  );

export const runtimeKnowledgeContextBuilder =
  new KnowledgeContextBuilder(
    knowledgePlatform,

    runtimeGenesisCanonicalConsumption
      .store,
  );

export const executiveRuntime =
  createExecutiveOrchestrator({
    knowledgeContextBuilder:
      runtimeKnowledgeContextBuilder,
  });

export const runtimeExecutiveReasoningService =
  new ExecutiveReasoningService(
    undefined,
    new FileExecutiveReasoningStore(),
  );

export const runtimeExecutiveDecisionService =
  new ExecutiveDecisionService();

export const runtimeChiefAgentReasoningDecisionService =
  new ChiefAgentReasoningDecisionService(
    runtimeExecutiveDecisionService,
  );

export const runtimeExecutiveApprovalService =
  new ExecutiveApprovalService();

export const runtimeExecutiveDecisionApprovalRequestService =
  new ExecutiveDecisionApprovalRequestService(
    runtimeExecutiveApprovalService,
  );

export const runtimeExecutiveApprovalDecisionService =
  new ExecutiveApprovalDecisionService(
    runtimeExecutiveApprovalService,
    runtimeExecutiveDecisionService,
  );

export const runtimeExecutiveDelegationService =
  new ExecutiveDelegationService();

export const runtimeExecutiveDecisionDelegationService =
  new ExecutiveDecisionDelegationService(
    runtimeExecutiveDelegationService,
  );

export const runtimeExecutiveActionService =
  new ExecutiveActionService();

export const runtimeExecutiveDecisionActionProposalService =
  new ExecutiveDecisionActionProposalService(
    runtimeExecutiveActionService,
  );

export const runtimeExecutiveDelegationActionProposalService =
  new ExecutiveDelegationActionProposalService(
    runtimeExecutiveDecisionActionProposalService,
  );

export const runtimeExecutiveDelegationActionReadinessService =
  new ExecutiveDelegationActionReadinessService(
    runtimeExecutiveDelegationService,
    runtimeExecutiveActionService,
  );

export const runtimeExecutiveActionExecutionAuthorizationService =
  new ExecutiveActionExecutionAuthorizationService();

export const runtimeExecutiveAuditService =
  new ExecutiveAuditService();

export const runtimeExecutiveActionExecutionStartService =
  new ExecutiveActionExecutionStartService(
    runtimeExecutiveActionService,
    runtimeExecutiveDelegationService,
    runtimeExecutiveActionExecutionAuthorizationService,
    runtimeExecutiveAuditService,
  );

export const runtimeExecutiveActionExecutionOutcomeService =
  new ExecutiveActionExecutionOutcomeService(
    runtimeExecutiveActionService,
    runtimeExecutiveDelegationService,
    runtimeExecutiveAuditService,
  );

export const runtimeExecutiveActionExecutorPolicyRegistry =
  new ExecutiveActionExecutorPolicyRegistry();

export const runtimeExecutiveActionExecutorRegistry =
  new ExecutiveActionExecutorRegistry();

const executiveMutationEnabled =
  process.env
    .LUMINA_EXECUTIVE_MUTATION_ENABLED ===
  "true";

configureExecutiveActionExecutorComposition({
  policyRegistry:
    runtimeExecutiveActionExecutorPolicyRegistry,

  executorRegistry:
    runtimeExecutiveActionExecutorRegistry,

  mutationEnabled:
    executiveMutationEnabled,
});

export const runtimeExecutiveActionExecutionDispatcher =
  new ExecutiveActionExecutionDispatcher(
    runtimeExecutiveActionService,
    runtimeExecutiveDelegationService,
    runtimeExecutiveActionExecutionAuthorizationService,
    runtimeExecutiveAuditService,
    runtimeExecutiveActionExecutionOutcomeService,
    runtimeExecutiveActionExecutorPolicyRegistry,
    runtimeExecutiveActionExecutorRegistry,
  );

export const runtimeChiefAgentReasoningExecutionService =
  new ChiefAgentReasoningExecutionService(
    /*
     * KO-5d (ADR-0041 Decision 9): provider and escalation come from
     * configuration. Defaults keep OpenAI as primary with no escalation.
     */
    createChiefAgentReasoningProvider(),
    runtimeExecutiveReasoningService,
  );

/*
 * EW-2 (F-24): what is happening now, read at the moment of reasoning.
 * The sources are defined later in this module and are only called when
 * the Chief Agent reasons or the owner asks to see its operational state.
 */
export const chiefAgentOperationalStateReader =
  new ChiefAgentOperationalStateReader({
    activation: () => {
      const status =
        chiefAgentActivationGate.status({
          includePrerequisites: false,
        });
      return {
        state: status.state,
        autonomyLevel: status.autonomyLevel ?? null,
      };
    },
    learning: () =>
      runtimeContinuousLearningService.status(),
    approvals: () =>
      runtimeExecutiveApprovalService.list(),
    decisions: () =>
      runtimeExecutiveDecisionService.list(),
    canonicalReviews: () =>
      runtimeKnowledgePreservationPlatform
        .packageService
        .list()
        .filter(
          (knowledgePackage) =>
            knowledgePackage.state === "awaiting_review" &&
            knowledgePackage.approvalState === "pending_review",
        )
        .map((knowledgePackage) => ({
          id: knowledgePackage.id,
          title:
            knowledgePackage.items[0]?.title ??
            knowledgePackage.id,
          classification:
            classifyCanonicalReview(knowledgePackage).mode,
          createdAt: knowledgePackage.createdAt,
          updatedAt: knowledgePackage.updatedAt,
        })),
  });

export const chiefAgentReasoningAdapter =
  new ChiefAgentReasoningDestinationAdapter(
    new ChiefAgentReasoningKnowledgeMaterializer(
      runtimeGenesisCanonicalConsumption
        .store,

      runtimeGenesisOrganizationalMemoryConsumption,
    ),
    {
      reason: async (input) => {
        await runtimeChiefAgentReasoningExecutionService
          .execute(
            input,
          );

        const persisted =
          runtimeExecutiveReasoningService
            .get(
              `reasoning:${input.eventId}`,
            );

        if (
          !persisted
        ) {
          throw new Error(
            "chief_agent_reasoning_result_not_persisted",
          );
        }

        const decision =
          runtimeChiefAgentReasoningDecisionService
            .createProposedDecision({
              reasoning:
                persisted,

              requestedBy:
                "chief-agent",
            });

        if (
          input.approverId &&
          decision.status ===
            "proposed"
        ) {
          runtimeExecutiveDecisionApprovalRequestService
            .requestApproval({
              decision,

              approverId:
                input.approverId,

              requestedBy:
                "chief-agent",
            });
        }

        return {
          title:
            persisted.title,

          disposition:
            persisted.disposition,

          conclusion:
            persisted.conclusion,

          confidence:
            persisted.confidence,

          evidence:
            persisted.evidence,

          assumptions:
            persisted.assumptions,

          metadata:
            persisted.metadata,
        };
      },
    },
    new ChiefAgentGovernedContentReader(
      resolveRepositoryRoot(),
    ),
    chiefAgentOperationalStateReader,
  );

const readChiefAgentActivationPrerequisites = () => {
  const dayZero =
    runtimeGenesisDayZeroCertificationService.read();
  const corpus =
    runtimeEducationalCorpusCertificationService.read();
  const competency =
    runtimeInitialCompetencyCertificationService.read();
  const acceptance =
    runtimeInitialCompetencyHumanAcceptanceService.read();
  const workspace =
    runtimeChiefAgentProductionWorkspaceAuthorizationService.read();

  return [
    {
      gate:
        "day-zero-certification",
      state:
        dayZero.state,
      id:
        dayZero.certification?.certificationId ?? null,
    },
    {
      gate:
        "educational-corpus-certification",
      state:
        corpus.state,
      id:
        corpus.certification?.certificationId ?? null,
    },
    {
      gate:
        "initial-competency-certification",
      state:
        competency.state,
      id:
        competency.certification?.certificationId ?? null,
    },
    {
      gate:
        "initial-competency-human-acceptance",
      state:
        acceptance.state,
      id:
        acceptance.acceptance?.acceptanceId ?? null,
    },
    {
      gate:
        "production-workspace-authorization",
      state:
        workspace.state,
      id:
        workspace.authorization?.authorizationId ?? null,
    },
  ];
};

/*
 * ADR-0041 (KO-5c): activation records are read from the tracked
 * governance store. The gate is ACTIVE only while the latest record is.
 */
export const chiefAgentActivationStore =
  new FileChiefAgentActivationStore();

export const chiefAgentActivationService =
  new ChiefAgentActivationService(
    chiefAgentActivationStore,
    readChiefAgentActivationPrerequisites,
  );

/*
 * ADR-0041 Decision 3 (KO-5b): Chief Agent reasoning runs only while the
 * activation gate is ACTIVE. Before activation the event is still recorded;
 * the reasoning destination is refused with chief_agent_not_activated.
 */
export const chiefAgentActivationGate =
  new ChiefAgentActivationGate(
    chiefAgentActivationStore,
    readChiefAgentActivationPrerequisites,
  );

executiveRuntime.dispatcher.register(
  "reasoning",
  requireActiveChiefAgent(
    chiefAgentActivationGate,
    (context) =>
      chiefAgentReasoningAdapter.handle(
        context,
      ),
  ),
);

/*
 * ADR-0041 Decision 5 (KO-5a): only the Builder's own origin may call the
 * Runtime from a browser, executive routes require Runtime access, and
 * human-only executive decisions refuse agent actors.
 */
const allowedRuntimeOrigins =
  resolveAllowedRuntimeOrigins(
    process.env
      .KORELUMINA_RUNTIME_ALLOWED_ORIGINS,
  );

app.use(
  rejectDisallowedBrowserOrigins(
    allowedRuntimeOrigins,
  ),
);
app.use(
  cors({
    origin:
      allowedRuntimeOrigins,
  }),
);
app.use(express.json());
app.use(trackRuntimeMutations);

/*
 * SEC-1c (ADR-0043): identify callers from a verified Supabase access token.
 * Requires SUPABASE_URL (and SUPABASE_JWT_SECRET for HS256 projects);
 * without them a bearer token cannot be verified and the caller is
 * anonymous.
 */
export const runtimeSupabaseAccessTokenVerifier =
  new SupabaseAccessTokenVerifier(
    supabaseTokenConfigFromEnvironment(),
  );

app.use(
  resolveRuntimeCaller(
    runtimeSupabaseAccessTokenVerifier,
  ),
);

registerRuntimeIdentityRoute(
  app,
  runtimeSupabaseAccessTokenVerifier,
);
app.use(
  "/api/executive",
  requireRuntimeAccess,
  rejectAgentActorsOnHumanOnlyExecutiveRoutes,
);

app.get(
  "/health",
  (_req, res) => {
    return res.json({
      ok: true,
      service: "lumina-runtime",
    });
  },
);

registerProjectsRoute(app);
registerProjectMetadataRoute(app);
registerImportProjectRoute(app);

registerStartRoute(app);
registerStatusRoute(app);
registerStopRoute(app);
registerRestartRoute(app);

registerLogsRoute(app);
registerMetricsRoute(app);
registerRuntimeScenarioRoute(app);
registerEventsRoute(app);

registerFsRoute(app);

registerAuditRoute(app);
registerFixPlanRoute(app);
registerGenerateFixesRoute(app);

registerDraftsRoute(app);
registerRevertDraftRoute(app);
registerCreateDraftRoute(app);
registerApplyDraftRoute(app);

registerKnowledgeOperationsRoutes(
  app,
  {
    service:
      runtimeKnowledgeOperationsService,
  },
);

const runtimeGenesisReplayExecutionRuntime = {
    persistenceStore:
      runtimeGenesisReplayPersistenceStore,

    platform:
      runtimeKnowledgePreservationPlatform,

    repositoryRoot:
      path.dirname(
        getRuntimeDataRoot(),
      ),

    now:
      () =>
        Date.now(),

    additionalDiscoverers: [
      runtimeGenesisPersistedConversationHistoricalSourceDiscoverer,
    ],

    conversationEvidenceResolver:
      runtimeGenesisConversationReplayEvidenceResolver,

    priorHistoricalCorrelation:
      () => {
        const currentInventory =
          listGenesisReplayInventory({
            persistence:
              runtimeGenesisReplayPersistenceStore,

            manufacturingRuns:
              runtimeKnowledgePreservationPlatform
                .manufacturingRunService,
          });

        const currentSelection =
          resolveGenesisRuntimeReplaySelection({
            designationStore:
              runtimeGenesisReplayDesignationStore,

            inventory:
              currentInventory,
          });

        if (
          currentSelection.state !==
            "SELECTED" ||
          currentSelection.replayId ===
            null
        ) {
          return null;
        }

        return runtimeGenesisHistoricalCorrelationPersistenceStore
          .load(
            currentSelection.replayId,
          );
      },
  };

registerGenesisReplayExecutionRoute(
  app,
  runtimeGenesisReplayExecutionRuntime,
);

/*
 * ADR-0042 (CL-1a): continuous learning. The owner's commits since the
 * learning checkpoint are captured by a bounded Genesis replay through
 * the same governed path as the replay route above.
 */
export const runtimeContinuousLearningService =
  new ContinuousLearningCycleService({
    ledger:
      new FileContinuousLearningLedger(),

    window:
      new GitLearningWindowSource(
        runtimeGenesisReplayExecutionRuntime.repositoryRoot,
      ),

    ownerEmails:
      (
        process.env
          .KORELUMINA_LEARNING_OWNER_EMAILS ??
        "kore20lllc@gmail.com"
      )
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean),

    /*
     * CL-1c: the Chief Agent writes the Learning Record with the same
     * primary model as its reasoning (LUMINA_REASONING_PRIMARY).
     */
    learner:
      new LearningRecordService(
        new LearningEvidenceCollector({
          repositoryRoot:
            runtimeGenesisReplayExecutionRuntime.repositoryRoot,
          executiveRoot:
            resolveExecutiveStorageRoot,
        }),
        new LearningRecordSynthesizer(
          createTextGenerationClient(
            resolveChiefAgentReasoningRouting().primary,
            resolveChiefAgentReasoningRouting().primaryModel,
          ),
          resolveChiefAgentReasoningRouting().confidenceThreshold,
        ),
        new LearningRecordWriter(
          runtimeGenesisReplayExecutionRuntime.repositoryRoot,
        ),
      ),

    initialCheckpointTime: () =>
      runtimeGenesisDayZeroCertificationPersistenceStore
        .load()
        ?.certifiedAt ??
      null,

    capture: async (request) => {
      const runtime =
        runtimeGenesisReplayExecutionRuntime;

      const result =
        await runGovernedGenesisReplay({
          mode:
            "PRODUCTION_ADMISSION",

          repositoryRoot:
            runtime.repositoryRoot,

          scope: {
            mode:
              "partial",
            repository:
              request.repository,
            ref:
              request.ref,
            historicalStart:
              request.historicalStart,
            includedEvidenceTypes: [
              "commit",
              "document",
              "ADR",
              "RFC",
              "specification",
              "roadmap",
              "milestone",
            ],
            excludedEvidenceTypes:
              [],
            explicitlyExcludedSourceIds:
              request.explicitlyExcludedSourceIds as `genesis-source:commit:${string}`[],
            governancePolicyVersion:
              "governance-v1",
            replayContractVersion:
              "1.0",
          },

          persistenceStore:
            runtime.persistenceStore,

          startedAt:
            runtime.now(),

          executionTimestampForManifestIndex:
            () =>
              runtime.now(),

          platform:
            runtime.platform,

          authorizeProductionAdmission:
            true,

          additionalDiscoverers:
            runtime.additionalDiscoverers,

          conversationEvidenceResolver:
            runtime.conversationEvidenceResolver,

          priorHistoricalCorrelation:
            runtime.priorHistoricalCorrelation(),

          manifestBuilder:
            windowedGenesisManifestBuilder,
        });

      if (
        result.mode !==
          "PRODUCTION_ADMISSION" ||
        result.runnerResult
          .outcome !==
          "COMPLETED"
      ) {
        throw new Error(
          `learning_capture_not_completed:${
            result.mode ===
              "PRODUCTION_ADMISSION"
              ? result.runnerResult.outcome
              : result.mode
          }`,
        );
      }

      return {
        replayId:
          result.plan.replayId,
        admittedSources:
          result.plan.summary.admit,
      };
    },
  });

export const runtimeContinuousLearningScheduler =
  new ContinuousLearningScheduler(
    runtimeContinuousLearningService,
    resolveLearningIntervalMinutes(
      process.env
        .KORELUMINA_LEARNING_INTERVAL_MINUTES,
    ),
  );

registerContinuousLearningRoutes(
  app,
  runtimeContinuousLearningService,
);

registerLearningGovernanceRoutes(
  app,
  {
    status: () => ({
      policy:
        loadCanonicalReviewPolicy(
          LEARNING_REVIEW_POLICY_ID,
          LEARNING_REVIEW_POLICY_VERSION,
        ),
      authorization:
        runtimeLearningPromotionAuthorizationStore.read(),
    }),

    setup: (actorId) => {
      const existing =
        loadCanonicalReviewPolicy(
          LEARNING_REVIEW_POLICY_ID,
          LEARNING_REVIEW_POLICY_VERSION,
        );

      if (!existing) {
        runtimeCanonicalReviewPolicyAdministrationService.createDraft({
          id:
            LEARNING_REVIEW_POLICY_ID,
          version:
            LEARNING_REVIEW_POLICY_VERSION,
          title:
            "Learning Records (ADR-0042)",
          authority:
            LEARNING_RECORD_AUTHORITY,
          scope:
            LEARNING_RECORD_SCOPE,
          owner:
            "Founder, Kore20 LLC",
          rules: {
            requireCompleteGovernanceIdentity:
              true,
            requireProvenance:
              true,
            requireValidationPassed:
              true,
            excludedAuthorities: [
              "constitutional",
            ],
          },
        });
      }

      const policy =
        existing?.status === "active"
          ? existing
          : runtimeCanonicalReviewPolicyAdministrationService.activate(
              LEARNING_REVIEW_POLICY_ID,
              LEARNING_REVIEW_POLICY_VERSION,
              { actorId },
            );

      return {
        policy,
        authorization:
          runtimeLearningPromotionAuthorizationStore.authorize(
            actorId,
            Date.now(),
          ),
      };
    },

    revoke: (actorId) => ({
      policy:
        runtimeCanonicalReviewPolicyAdministrationService.revoke(
          LEARNING_REVIEW_POLICY_ID,
          LEARNING_REVIEW_POLICY_VERSION,
          { actorId },
        ),
      authorization:
        runtimeLearningPromotionAuthorizationStore.revoke(
          actorId,
          Date.now(),
        ),
    }),
  },
);

registerGenesisConversationAcquisitionRoutes(
  app,
  {
    executor:
      runtimeGenesisConversationAcquisitionExecutor,

    configuration:
      runtimeGenesisConversationConfiguration,
  },
);


registerGenesisConversationExpectedHistoryCandidateRoutes(
  app,
  {
    service:
      runtimeGenesisConversationExpectedHistoryCandidateService,
  },
);

registerGenesisConversationExpectedHistoryCandidateReviewRoutes(
  app,
  {
    service:
      runtimeGenesisConversationExpectedHistoryCandidateReviewService,
  },
);


registerGenesisConversationAuthoritativeCompletenessEvidenceRoute(
  app,
  {
    service:
      runtimeGenesisConversationAuthoritativeCompletenessEvidenceService,
  },
);


registerGenesisConversationAuthoritativeCompletenessCertificationRoutes(
  app,
  {
    service:
      runtimeGenesisConversationAuthoritativeCompletenessCertificationService,
  },
);


registerGenesisConversationExpectedHistoryRoutes(
  app,
  {
    service:
      runtimeGenesisConversationHistoryReconciliationService,
  },
);


registerGenesisConversationAuthoritativeExpectedHistoryRoute(
  app,
  {
    service:
      runtimeGenesisConversationAuthoritativeExpectedHistoryService,
  },
);


registerGenesisConversationExpectedHistoryAmendmentRoute(
  app,
  {
    service:
      runtimeGenesisConversationExpectedHistoryAmendmentService,
  },
);


registerGenesisDayZeroCertificationRoutes(
  app,
  {
    service:
      runtimeGenesisDayZeroCertificationService,
  },
);


registerGenesisDayZeroConversationCoverageCertificationRoutes(
  app,
  {
    service:
      runtimeGenesisDayZeroConversationCoverageCertificationService,
  },
);



registerGenesisReplayStatusRoute(
  app,
  {
    persistence:
      runtimeGenesisReplayPersistenceStore,

    manufacturingRuns:
      runtimeKnowledgePreservationPlatform
        .manufacturingRunService,
  },
);

registerGenesisReplayInventoryRoute(
  app,
  {
    persistence:
      runtimeGenesisReplayPersistenceStore,

    manufacturingRuns:
      runtimeKnowledgePreservationPlatform
        .manufacturingRunService,
  },
);

registerGenesisReplayDesignationRoute(
  app,
  {
    listReplayInventory:
      () =>
        listGenesisReplayInventory({
          persistence:
            runtimeGenesisReplayPersistenceStore,

          manufacturingRuns:
            runtimeKnowledgePreservationPlatform
              .manufacturingRunService,
        }),

    designationStore:
      runtimeGenesisReplayDesignationStore,
  },
);


registerGenesisOperationalProjectionRoute(
  app,
  {
    replayPersistence:
      runtimeGenesisReplayPersistenceStore,

    historicalCorrelation:
      runtimeGenesisHistoricalCorrelationPersistenceStore,

    manufacturingRuns:
      runtimeKnowledgePreservationPlatform
        .manufacturingRunService,

    organizationalMemory:
      runtimeOrganizationalMemoryStore,

    readinessPolicy:
      runtimeGenesisReadinessPolicy,

    conversationSource:
      runtimeGenesisConversationConfiguration
        .boundary,

    conversationHistoryReconciliation:
      () =>
        runtimeGenesisConversationHistoryReconciliationService
          .read(),
  },
);

registerKnowledgePreservationRoutes(
  app,
  {
    preservationPlatform:
      runtimeKnowledgePreservationPlatform,
  },
);

registerCanonicalReviewRoutes(
  app,
  {
    reviewService:
      runtimeCanonicalReviewService,

    packageService:
      runtimeKnowledgePreservationPlatform
        .packageService,
  },
);

registerCanonicalReviewBatchRoutes(
  app,
  {
    batchService:
      runtimeCanonicalReviewBatchService,
  },
);

registerCanonicalReviewPolicyRoutes(
  app,
);

registerCanonicalReviewPolicyAdministrationRoutes(
  app,
  {
    service:
      runtimeCanonicalReviewPolicyAdministrationService,
  },
);

registerCanonicalReviewPolicyExecutionRoutes(
  app,
  {
    service:
      runtimeCanonicalReviewPolicyExecutionService,
  },
);

registerCanonicalReviewPolicyBindingRoutes(
  app,
  {
    service:
      runtimeCanonicalReviewPolicyBindingService,
  },
);

registerCanonicalPromotionRoutes(
  app,
  {
    promotionService:
      runtimeGovernedPromotionService,
  },
);

registerAutonomousCanonicalPromotionRoutes(
  app,
  {
    executor:
      runtimeAutonomousGovernedPromotionExecutor,
  },
);

registerAutonomousGovernanceCycleRoutes(
  app,
  {
    orchestrator:
      runtimeAutonomousGovernanceCycleOrchestrator,
  },
);

registerLegacyHistoricalReconciliationRoutes(
  app,
  {
    orchestrator:
      runtimeLegacyHistoricalReconciliationOrchestrator,
  },
);


registerOrganizationalMemoryAdaptationRoutes(
  app,
  {
    packageService:
      runtimeKnowledgePreservationPlatform
        .packageService,

    canonicalStore:
      knowledgePlatform.store,

    adaptationService:
      runtimeGovernedCanonicalMemoryAdaptationService,
  },
);

registerKnowledgeManufacturingReplayRoutes(
  app,
  {
    manufacturingRunService:
      runtimeKnowledgePreservationPlatform
        .manufacturingRunService,

    replayService:
      knowledgeManufacturingReplayService,
  },
);

registerGovernedRetrievalObservationRoute(
  app,
  {
    knowledgeContextBuilder:
      runtimeKnowledgeContextBuilder,
  },
);


registerKnowledgeEducationRoutes(
  app,
  {
    projectionService:
      runtimeKnowledgeEducationProjectionService,

    educationalCorpusService:
      runtimeEducationalCorpusService,

    educationalCorpusCertificationService:
      runtimeEducationalCorpusCertificationService,

    initialCompetencyAssessmentService:
      runtimeInitialCompetencyAssessmentService,

    initialCompetencyEvidenceService:
      runtimeInitialCompetencyEvidenceValidationService,

    initialCompetencyCertificationService:
      runtimeInitialCompetencyCertificationService,

    initialCompetencyHumanAcceptanceService:
      runtimeInitialCompetencyHumanAcceptanceService,

    chiefAgentProductionWorkspaceAuthorizationService:
      runtimeChiefAgentProductionWorkspaceAuthorizationService,
  },
);

registerKnowledgeProductionLifecycleRoutes(
  app,
  {
    packageService:
      runtimeKnowledgePreservationPlatform
        .packageService,

    manufacturingRunService:
      runtimeKnowledgePreservationPlatform
        .manufacturingRunService,

    replayService:
      knowledgeManufacturingReplayService,

    canonicalStore:
      knowledgePlatform.store,

    memoryStore:
      runtimeOrganizationalMemoryStore,
  },
);

registerExecutiveRoute(
  app,
  executiveRuntime,
);

registerExecutiveActivationRoute(
  app,
  chiefAgentActivationGate,
  chiefAgentActivationService,
);

registerExecutiveReasoningRoute(
  app,
  runtimeExecutiveReasoningService,
);

registerExecutiveOperationalStateRoute(
  app,
  chiefAgentOperationalStateReader,
);

registerExecutiveOperationsSnapshotRoute(
  app,
  {
    reasoningService:
      runtimeExecutiveReasoningService,

    decisionService:
      runtimeExecutiveDecisionService,

    approvalService:
      runtimeExecutiveApprovalService,

    delegationService:
      runtimeExecutiveDelegationService,

    actionService:
      runtimeExecutiveActionService,

    auditService:
      runtimeExecutiveAuditService,

    mutationEnabled:
      executiveMutationEnabled,
  },
);

registerExecutiveDecisionRoute(
  app,
  {
    decisionService:
      runtimeExecutiveDecisionService,

    decisionDelegationService:
      runtimeExecutiveDecisionDelegationService,

    delegationActionProposalService:
      runtimeExecutiveDelegationActionProposalService,
  },
);

registerExecutiveDelegationRoute(
  app,
  {
    delegationService:
      runtimeExecutiveDelegationService,

    readinessService:
      runtimeExecutiveDelegationActionReadinessService,
  },
);

registerExecutiveActionRoute(
  app,
  {
    actionService:
      runtimeExecutiveActionService,

    delegationService:
      runtimeExecutiveDelegationService,

    executionAuthorizationService:
      runtimeExecutiveActionExecutionAuthorizationService,

    executionStartService:
      runtimeExecutiveActionExecutionStartService,

    executionOutcomeService:
      runtimeExecutiveActionExecutionOutcomeService,
  },
);

registerExecutiveActionExecutionRoute(
  app,
  runtimeExecutiveActionExecutionDispatcher,
);

registerExecutiveActionMutationRoute(
  app,
  runtimeExecutiveActionExecutionDispatcher,
  {
    enabled:
      executiveMutationEnabled,
  },
);

registerExecutiveActionMutationRoute(
  app,
  runtimeExecutiveActionExecutionDispatcher,
  {
    enabled:
      process.env
        .LUMINA_EXECUTIVE_MUTATION_ENABLED ===
      "true",
  },
);

registerExecutiveApprovalRoute(
  app,
  {
    approvalService:
      runtimeExecutiveApprovalService,

    approvalDecisionService:
      runtimeExecutiveApprovalDecisionService,
  },
);

export async function startLuminaRuntimeServer():
Promise<void> {
  const PORT =
    Number(
      process.env
        .LUMINA_RUNTIME_PORT,
    ) ||
    4100;

  const RUNTIME_HOST =
    resolveRuntimeHost(
      process.env
        .KORELUMINA_RUNTIME_HOST,
    );

  const shouldBootstrap =
    claimRuntimeBootstrap();

  if (
    shouldBootstrap
  ) {
    backfillMissingProjectMetadata();

    await recoverPersistedRuntimes();

    startRuntimeSupervisor();

    /*
     * Event-driven governance is primary.
     *
     * Recovery executes once at Runtime startup and then every
     * five minutes only to recover packages stranded by a lost
     * in-process governance-ready signal or Runtime crash.
     */
    runtimeGovernanceReadyRecoveryScheduler
      .start();

    runtimeContinuousLearningScheduler
      .start();
  } else {
    console.warn(
      "[lumina-runtime] bootstrap already claimed; skipping recovery/supervisor",
    );
  }

  const server =
    app.listen(
      PORT,
      RUNTIME_HOST,
      () => {
        console.log(
          `[lumina-runtime] listening on ${RUNTIME_HOST}:${PORT}`,
        );
      },
    );

  let shuttingDown =
    false;

  async function shutdown(
    signal:
      string,
  ) {
    if (
      shuttingDown
    ) {
      return;
    }

    shuttingDown =
      true;

    console.log(
      `[lumina-runtime] shutting down: ${signal}`,
    );

    stopRuntimeSupervisor();

    runtimeGovernanceReadyRecoveryScheduler
      .stop();

    runtimeContinuousLearningScheduler
      .stop();

    await stopAllWorkspaceWatchers();

    await stopAllRuntimes();

    server.close(
      () => {
        process.exit(
          0,
        );
      },
    );

    setTimeout(
      () => {
        process.exit(
          1,
        );
      },
      5000,
    ).unref();
  }

  process.on(
    "SIGINT",
    () => {
      void shutdown(
        "SIGINT",
      );
    },
  );

  process.on(
    "SIGTERM",
    () => {
      void shutdown(
        "SIGTERM",
      );
    },
  );

  process.on(
    "uncaughtException",
    (
      error,
    ) => {
      console.error(
        "[runtime] uncaughtException",
        error,
      );
    },
  );

  process.on(
    "unhandledRejection",
    (
      error,
    ) => {
      console.error(
        "[runtime] unhandledRejection",
        error,
      );
    },
  );
}


function isDirectRuntimeEntrypoint():
boolean {
  const entry =
    process.argv[1];

  if (
    !entry
  ) {
    return false;
  }

  return (
    fileURLToPath(
      import.meta.url,
    ) ===
    path.resolve(
      entry,
    )
  );
}


if (
  isDirectRuntimeEntrypoint()
) {
  void startLuminaRuntimeServer();
}
