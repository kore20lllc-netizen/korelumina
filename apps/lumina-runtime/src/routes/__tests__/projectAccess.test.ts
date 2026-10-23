import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import express from "express";

import type { ProjectMetadata } from "../../projects/projectMetadataStore.js";
import { publishRuntimeEvent, attachRuntimeEventStream } from "../../runtime/eventBus.js";
import { registerFsRoute } from "../fs.js";
import { registerLogsRoute } from "../logs.js";
import { registerMetricsRoute } from "../metrics.js";
import { decideProjectAccess, type ProjectAction } from "../projectAccess.js";
import type { RuntimeCaller, RuntimeCallerRole } from "../runtimeCaller.js";
import { registerStopRoute } from "../stop.js";

/* F-47: a project's files, process and logs belong to the people who may see it. */

const caller = (role: RuntimeCallerRole, userId = "alice", teamId?: string): RuntimeCaller => ({
  role,
  userId,
  teamId,
  supportAccess: role === "inhouse-dev" || role === "admin" || role === "super_admin",
  adminTools: role === "admin" || role === "super_admin",
});

const owned: ProjectMetadata = {
  projectId: "shop",
  ownerId: "alice",
  teamId: "team-1",
  visibility: "team",
  createdAt: 1,
  updatedAt: 1,
};

function table(who: RuntimeCaller, metadata: ProjectMetadata | null) {
  return Object.fromEntries((["view", "manage"] as ProjectAction[]).map((action) => {
    const decision = decideProjectAccess(who, metadata, action);
    return [action, decision.ok ? "allowed" : `${decision.status} ${decision.error}`];
  }));
}

test("the owner may view and manage their project", () => {
  assert.deepEqual(table(caller("pro"), owned), { view: "allowed", manage: "allowed" });
});

test("a stranger is told the project does not exist", () => {
  assert.deepEqual(table(caller("business", "mallory"), owned), {
    view: "404 project_not_found",
    manage: "404 project_not_found",
  });
  assert.deepEqual(table(caller("pro"), null), {
    view: "404 project_not_found",
    manage: "404 project_not_found",
  });
});

test("a teammate may view but not change", () => {
  assert.deepEqual(table(caller("pro", "bob", "team-1"), owned), {
    view: "allowed",
    manage: "403 forbidden",
  });
});

test("in-house engineers and admins may work on any project", () => {
  for (const role of ["inhouse-dev", "admin", "super_admin"] as const) {
    assert.deepEqual(table(caller(role, "staff"), owned), { view: "allowed", manage: "allowed" }, role);
  }
});

async function withServer<T>(register: (app: express.Express) => void, run: (base: string) => Promise<T>): Promise<T> {
  const app = express();
  app.use(express.json());
  register(app);
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

const as = (role: string, userId: string) => ({
  "x-korelumina-role": role,
  "x-korelumina-user-id": userId,
  "Content-Type": "application/json",
});

test("files, logs and stop refuse a caller who may not see the project", async () => {
  await withServer(
    (app) => {
      registerFsRoute(app);
      registerLogsRoute(app);
      registerStopRoute(app);
      registerMetricsRoute(app);
    },
    async (base) => {
      const stranger = as("pro", "mallory");
      const read = await fetch(`${base}/api/runtime/fs/read?projectId=no-such-shop&file=src/App.tsx`, { headers: stranger });
      assert.equal(read.status, 404);
      assert.equal((await read.json()).error, "project_not_found");

      const write = await fetch(`${base}/api/runtime/fs/write`, {
        method: "POST",
        headers: stranger,
        body: JSON.stringify({ projectId: "no-such-shop", file: "x.ts", content: "pwned" }),
      });
      assert.equal(write.status, 404);

      const logs = await fetch(`${base}/api/runtime/logs?projectId=no-such-shop`, { headers: stranger });
      assert.equal((await logs.json()).error, "project_not_found");

      const stop = await fetch(`${base}/api/runtime/stop`, {
        method: "POST",
        headers: stranger,
        body: JSON.stringify({ projectId: "no-such-shop" }),
      });
      assert.equal(stop.status, 404);

      const metrics = await fetch(`${base}/api/runtime/metrics`, { headers: stranger });
      assert.equal(metrics.status, 403);
      assert.equal((await metrics.json()).error, "staff_only");
    },
  );
});

test("the live stream carries only events the subscriber may see", () => {
  const written: string[] = [];
  const handlers: Record<string, () => void> = {};
  const res = {
    setHeader: () => undefined,
    flushHeaders: () => undefined,
    write: (chunk: string) => written.push(chunk),
    on: (name: string, handler: () => void) => {
      handlers[name] = handler;
    },
  };
  attachRuntimeEventStream(res as never, (event) => event.projectId === "mine");
  publishRuntimeEvent({ type: "runtime:log", projectId: "mine", message: "hello" });
  publishRuntimeEvent({ type: "runtime:log", projectId: "theirs", message: "secret" });
  handlers.close?.();

  const data = written.filter((chunk) => chunk.startsWith("data:"));
  assert.equal(data.length, 1);
  assert.match(data[0], /hello/);
  assert.doesNotMatch(written.join(""), /secret/);
});
