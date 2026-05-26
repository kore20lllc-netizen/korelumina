import express from "express";
import cors from "cors";

import { registerProjectsRoute } from "./routes/projects";
import { registerStartRoute } from "./routes/start";
import { registerStatusRoute } from "./routes/status";
import { registerStopRoute } from "./routes/stop";
import { registerRestartRoute } from "./routes/restart";
import { registerLogsRoute } from "./routes/logs";

import { stopAllRuntimes } from "./runtime/registry";

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

registerProjectsRoute(
  app,
);

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

const PORT =
  Number(
    process.env
      .LUMINA_RUNTIME_PORT,
  ) || 4100;

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
