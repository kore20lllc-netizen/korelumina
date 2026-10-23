import type { Express } from "express";

import { aiProviderStatus } from "../ai/AIOrchestrator.js";
import { getRuntimeCaller } from "./runtimeCaller.js";

/*
 * MS-2026-0011: tells the interface which model drafts changes and
 * whether it can be used, so AI Assist never pretends. Names only: no key
 * or part of one is ever returned.
 */
export function registerAIStatusRoute(app: Express) {
  app.get("/api/runtime/ai/status", (req, res) => {
    const caller = getRuntimeCaller(req);
    if (!caller.userId) {
      return res.status(401).json({ ok: false, error: "authentication_required" });
    }
    return res.json({ ok: true, ...aiProviderStatus() });
  });
}
