import express from "express";
import cors from "cors";

import { registerProjectsRoute } from "./routes/projects.js";
import { registerStartRoute } from "./routes/start.js";
import { registerStatusRoute } from "./routes/status.js";
import { registerStopRoute } from "./routes/stop.js";
import { stopAllRuntimes } from "./runtime/registry.js";

const app = express();

app.use(cors());
app.use(express.json());

registerProjectsRoute(app);
registerStartRoute(app);
registerStatusRoute(app);
registerStopRoute(app);

const PORT = 4100;

const server = app.listen(PORT, () => {
  console.log(`[lumina-runtime] listening on ${PORT}`);
});

function shutdown(signal: string) {
  console.log(`[lumina-runtime] shutting down: ${signal}`);

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
