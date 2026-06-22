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

import { stopAllRuntimes } from "./runtime/registry.js";
import { startRuntimeSupervisor, stopRuntimeSupervisor } from "./runtime/supervisor.js";
import { recoverPersistedRuntimes } from "./runtime/recovery.js";
import { claimRuntimeBootstrap } from "./runtime/bootstrapGuard.js";
import { stopAllWorkspaceWatchers } from "./runtime/workspaceWatcher.js";
import { backfillMissingProjectMetadata } from "./projects/projectMetadataMigration.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get(
  "/health",
  (_req, res) => {
    return res.json({
      ok: true,
      service:
        "lumina-runtime",
    });
  },
);

registerProjectsRoute(app);
registerProjectMetadataRoute(app);
registerImportProjectRoute(app);

registerStartRoute(
  app,
);

registerStatusRoute(
  app,
);

registerStopRoute(
  app,
);

registerRestartRoute(
  app,
);

registerLogsRoute(
  app,
);

registerMetricsRoute(
  app,
);

registerEventsRoute(
  app,
);

registerFsRoute(
  app,
);

registerAuditRoute(
  app,
);

registerFixPlanRoute(
  app,
);

registerGenerateFixesRoute(
  app,
);

registerDraftsRoute(
  app,
);

registerRevertDraftRoute(
  app,
);

registerCreateDraftRoute(
  app,
);

registerApplyDraftRoute(
  app,
);

const PORT =
  Number(
    process.env
      .LUMINA_RUNTIME_PORT,
  ) || 4100;

const shouldBootstrap =
  claimRuntimeBootstrap();

if (shouldBootstrap) {
  backfillMissingProjectMetadata();
  await recoverPersistedRuntimes();
  startRuntimeSupervisor();
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
  signal: string,
) {
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
  (error) => {
    console.error(
      "[runtime] uncaughtException",
      error,
    );
  },
);

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "[runtime] unhandledRejection",
      error,
    );
  },
);
