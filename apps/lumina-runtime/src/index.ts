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
import { registerCanonicalReviewRoutes } from "./routes/knowledge/registerCanonicalReviewRoutes.js";
import { registerCanonicalReviewBatchRoutes } from "./routes/knowledge/registerCanonicalReviewBatchRoutes.js";
import { registerCanonicalPromotionRoutes } from "./routes/knowledge/registerCanonicalPromotionRoutes.js";
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
  CanonicalReviewService,
} from "./knowledge-preservation/review/index.js";

import {
  GovernedCanonicalPromotionService,
} from "./knowledge-preservation/promotion/index.js";

import {
  createKnowledgePreservationPlatform,
} from "./knowledge-preservation/bootstrap/index.js";

import {
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
  registerKnowledgeManufacturingReplayRoutes,
} from "./routes/knowledge/registerKnowledgeManufacturingReplayRoutes.js";

import {
  knowledgeManufacturingReplayService,
} from "./knowledge-preservation/manufacturing/index.js";

const app = express();

const knowledgePlatform =
  runtimeKnowledgeProvider.getPlatform();

export const runtimeKnowledgePreservationPlatform =
  createKnowledgePreservationPlatform();

rehydrateRuntimeCanonicalKnowledge(
  knowledgePlatform,
);

export const runtimeOrganizationalMemoryStore =
  new RuntimeOrganizationalMemoryStore();

export const runtimeOrganizationalMemoryProvider =
  new RuntimeOrganizationalMemoryProvider(
    runtimeOrganizationalMemoryStore,
  );

export const runtimeGovernedCanonicalMemoryAdaptationService =
  new GovernedCanonicalMemoryAdaptationService(
    runtimeOrganizationalMemoryStore,
  );

registerOrganizationalMemoryProvider(
  runtimeOrganizationalMemoryProvider,
);

export const runtimeCanonicalReviewService =
  new CanonicalReviewService(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeKnowledgePreservationPlatform
      .manufacturingRunService,
  );

export const runtimeCanonicalReviewBatchService =
  new CanonicalReviewBatchService(
    runtimeKnowledgePreservationPlatform
      .packageService,
    runtimeCanonicalReviewService,
  );

export const runtimeKnowledgeEducationProjectionService =
  new KnowledgeEducationProjectionService(
    knowledgePlatform.store,
  );

export const runtimeGovernedPromotionService =
  new GovernedCanonicalPromotionService(
    runtimeKnowledgePreservationPlatform
      .packageService,
    knowledgePlatform.store,
    runtimeKnowledgePreservationPlatform
      .manufacturingRunService,
  );

const knowledgeContextBuilder =
  new KnowledgeContextBuilder(
    knowledgePlatform,
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
      knowledgePlatform.store,
      runtimeOrganizationalMemoryStore,
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

registerKnowledgeOperationsRoutes(app);

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

registerCanonicalPromotionRoutes(
  app,
  {
    promotionService:
      runtimeGovernedPromotionService,
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

const PORT =
  Number(process.env.LUMINA_RUNTIME_PORT) || 4100;

const shouldBootstrap = claimRuntimeBootstrap();

if (shouldBootstrap) {
  backfillMissingProjectMetadata();
  await recoverPersistedRuntimes();
  startRuntimeSupervisor();
} else {
  console.warn(
    "[lumina-runtime] bootstrap already claimed; skipping recovery/supervisor",
  );
}

const server = app.listen(PORT, () => {
  console.log(
    `[lumina-runtime] listening on ${PORT}`,
  );
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `[lumina-runtime] shutting down: ${signal}`,
  );

  stopRuntimeSupervisor();

  await stopAllWorkspaceWatchers();

  await stopAllRuntimes();

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  console.error(
    "[runtime] uncaughtException",
    error,
  );
});

process.on("unhandledRejection", (error) => {
  console.error(
    "[runtime] unhandledRejection",
    error,
  );
});
