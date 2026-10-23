import type { Express } from "express";

import { attachRuntimeEventStream } from "../runtime/eventBus.js";
import { callerMayViewProject } from "./projectAccess.js";
import { getRuntimeCaller } from "./runtimeCaller.js";

/*
 * F-47: the live stream carries each project's logs, so a subscriber
 * receives only the events of projects it may see. Events that name no
 * project go to staff only.
 */
export function registerEventsRoute(app: Express) {
  app.get("/api/runtime/events", (req, res) => {
    const caller = getRuntimeCaller(req);
    const staff = caller.supportAccess || caller.adminTools;
    attachRuntimeEventStream(res, (event) =>
      event.projectId ? callerMayViewProject(caller, event.projectId) : staff,
    );
  });
}
