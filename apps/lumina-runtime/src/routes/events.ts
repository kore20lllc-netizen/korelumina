import type { Express } from "express";

import { attachRuntimeEventStream } from "../runtime/eventBus.js";

export function registerEventsRoute(app: Express) {
  app.get("/api/runtime/events", (_req, res) => {
    attachRuntimeEventStream(res);
  });
}
