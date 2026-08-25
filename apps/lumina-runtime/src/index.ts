import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  registerRuntimeScenarioRoute,
} from "./routes/runtimeScenario.js";

import express from "express";
import cors from "cors";

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
import { registerExecutiveReasoningRoute } from "./routes/executiveReasoning.js";
import { registerExecutiveOperationsSnapshotRoute } from "./routes/executiveOperationsSnapshot.js";
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
  EducationalCorpusCertificationService,
  EducationalCorpusRuntimeService,
  FileEducationalCorpusCertificationPersistenceStore,
  FileEducationalCorpusPersistenceStore,
  KnowledgeEducationProjectionService,
} from "./knowledge-education/index.js";

import {
  registerKnowledgeEducationRoutes,
} from "./routes/knowledge/registerKnowledgeEducationRoutes.js";

import {
  createExecutiveOrchestrator,
} from "./executive/orchestrator/index.js";

import {
  ChiefAgentReasoningDecisionService,
  ChiefAgentReasoningDestinationAdapter,
  ChiefAgentReasoningExecutionService,
  ChiefAgentReasoningKnowledgeMaterializer,
  ExecutiveReasoningService,
  TextGenerationChiefAgentReasoningProvider,
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

import {
  OpenAITextGenerationClient,
} from "./ai/model/index.js";

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
  registerGenesisConversationExpectedHistoryRoutes,
} from "./routes/genesisConversationExpectedHistory.js";


import {
  registerGenesisDayZeroCertificationRoutes,
} from "./routes/genesisDayZeroCertification.js";


import {
  knowledgeManufacturingReplayService,
} from "./knowledge-preservation/manufacturing/index.js";

import {
  buildGenesisRuntimeCanonicalConsumptionView,
  FileGenesisConversationAcquisitionPersistenceStore,
  FileGenesisConversationExpectedHistoryCandidatePersistenceStore,
  FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore,
  FileGenesisConversationExpectedHistoryPersistenceStore,
  GenesisConversationExpectedHistoryCandidateReviewService,
  GenesisConversationExpectedHistoryCandidateService,
  GenesisConversationAuthoritativeCompletenessEvidenceService,
  FileGenesisDayZeroCertificationPersistenceStore,
  GenesisConversationAcquisitionExecutor,
  GenesisConversationHistoryReconciliationService,
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


export const runtimeGenesisConversationAuthoritativeCompletenessEvidenceService =
  new GenesisConversationAuthoritativeCompletenessEvidenceService(
    runtimeGenesisConversationExpectedHistoryCandidateService,
    runtimeGenesisConversationExpectedHistoryCandidateReviewService,
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

export const runtimeGenesisDayZeroCertificationService =
  new GenesisDayZeroCertificationService(
    runtimeGenesisDayZeroCertificationPersistenceStore,
    {
      readCurrentCandidate:
        () => {
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
          }).dayZeroCertificationCandidate;
        },
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


export const runtimeEducationalCorpusService =
  new EducationalCorpusRuntimeService(
    runtimeEducationalCorpusPersistenceStore,
    runtimeKnowledgeEducationProjectionService,
    runtimeGenesisDayZeroCertificationService,
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

export const runtimeAutonomousGovernedPromotionExecutor =
  new AutonomousGovernedCanonicalPromotionExecutor(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeKnowledgePreservationPlatform
      .manufacturingRunService,
    runtimeGovernedPromotionService,
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

const knowledgeContextBuilder =
  new KnowledgeContextBuilder(
    knowledgePlatform,

    runtimeGenesisCanonicalConsumption
      .store,
  );

export const executiveRuntime =
  createExecutiveOrchestrator({
    knowledgeContextBuilder,
  });

export const runtimeExecutiveReasoningService =
  new ExecutiveReasoningService();

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
    new TextGenerationChiefAgentReasoningProvider(
      new OpenAITextGenerationClient(),
    ),
    runtimeExecutiveReasoningService,
  );

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
  );

executiveRuntime.dispatcher.register(
  "reasoning",
  (context) =>
    chiefAgentReasoningAdapter.handle(
      context,
    ),
);

app.use(cors());
app.use(express.json());

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

registerGenesisReplayExecutionRoute(
  app,
  {
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


registerGenesisConversationExpectedHistoryRoutes(
  app,
  {
    service:
      runtimeGenesisConversationHistoryReconciliationService,
  },
);


registerGenesisDayZeroCertificationRoutes(
  app,
  {
    service:
      runtimeGenesisDayZeroCertificationService,
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

registerKnowledgeEducationRoutes(
  app,
  {
    projectionService:
      runtimeKnowledgeEducationProjectionService,

    educationalCorpusService:
      runtimeEducationalCorpusService,

    educationalCorpusCertificationService:
      runtimeEducationalCorpusCertificationService,
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

registerExecutiveReasoningRoute(
  app,
  runtimeExecutiveReasoningService,
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
  } else {
    console.warn(
      "[lumina-runtime] bootstrap already claimed; skipping recovery/supervisor",
    );
  }

  const server =
    app.listen(
      PORT,
      () => {
        console.log(
          `[lumina-runtime] listening on ${PORT}`,
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
