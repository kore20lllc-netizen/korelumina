import assert from "node:assert/strict";
import test from "node:test";

import type {
  AddressInfo,
} from "node:net";

import express from "express";
import cors from "cors";

import {
  DEFAULT_RUNTIME_ALLOWED_ORIGINS,
  isAgentActorId,
  isHumanOnlyExecutivePath,
  rejectAgentActorsOnHumanOnlyExecutiveRoutes,
  rejectDisallowedBrowserOrigins,
  resolveAllowedRuntimeOrigins,
  resolveRuntimeHost,
} from "../runtimeBoundary.js";

import {
  requireRuntimeAccess,
} from "../runtimeAccess.js";

function boundaryApp() {
  const app =
    express();

  const allowed =
    resolveAllowedRuntimeOrigins(
      undefined,
    );

  app.use(
    rejectDisallowedBrowserOrigins(
      allowed,
    ),
  );
  app.use(
    cors({
      origin:
        allowed,
    }),
  );
  app.use(express.json());
  app.use(
    "/api/executive",
    requireRuntimeAccess,
    rejectAgentActorsOnHumanOnlyExecutiveRoutes,
  );

  app.post(
    "/api/executive/approvals/:id/approve",
    (_req, res) => res.json({ ok: true, reached: "approve" }),
  );
  app.post(
    "/api/executive/delegations/:id/accept",
    (_req, res) => res.json({ ok: true, reached: "accept" }),
  );
  app.get(
    "/api/knowledge/education",
    (_req, res) => res.json({ ok: true, reached: "education" }),
  );

  return app;
}

async function withServer(
  run:
    (base: string) => Promise<void>,
) {
  const server =
    boundaryApp().listen(
      0,
      "127.0.0.1",
    );

  await new Promise<void>(
    (resolve) =>
      server.once(
        "listening",
        () => resolve(),
      ),
  );

  const { port } =
    server.address() as AddressInfo;

  try {
    await run(
      `http://127.0.0.1:${port}`,
    );
  } finally {
    await new Promise<void>(
      (resolve) =>
        server.close(
          () => resolve(),
        ),
    );
  }
}

test(
  "runtime binds to loopback by default and honours an explicit host",
  () => {
    assert.equal(resolveRuntimeHost(undefined), "127.0.0.1");
    assert.equal(resolveRuntimeHost("  "), "127.0.0.1");
    assert.equal(resolveRuntimeHost("0.0.0.0"), "0.0.0.0");
  },
);

test(
  "allowed origins default to the Builder and accept a configured list",
  () => {
    assert.deepEqual(
      resolveAllowedRuntimeOrigins(undefined),
      [...DEFAULT_RUNTIME_ALLOWED_ORIGINS],
    );
    assert.deepEqual(
      resolveAllowedRuntimeOrigins(" http://a.test/ , http://b.test "),
      ["http://a.test", "http://b.test"],
    );
  },
);

test(
  "human-only executive paths and agent actors are recognised",
  () => {
    assert.ok(isHumanOnlyExecutivePath("/approvals/x/approve"));
    assert.ok(isHumanOnlyExecutivePath("/approvals/x/reject"));
    assert.ok(isHumanOnlyExecutivePath("/actions/x/authorize-execution"));
    assert.ok(isHumanOnlyExecutivePath("/actions/x/execute-operation"));
    assert.ok(isHumanOnlyExecutivePath("/actions/x/execute-mutation"));
    assert.ok(isHumanOnlyExecutivePath("/decisions/x/delegate"));
    assert.ok(!isHumanOnlyExecutivePath("/delegations/x/accept"));
    assert.ok(!isHumanOnlyExecutivePath("/events"));

    assert.ok(isAgentActorId("chief-agent"));
    assert.ok(isAgentActorId("Chief-Agent"));
    assert.ok(isAgentActorId("engineer-agent"));
    assert.ok(isAgentActorId("agent:specialist-7"));
    assert.ok(!isAgentActorId("human-review:repository-owner"));
    assert.ok(!isAgentActorId("eric"));
  },
);

test(
  "a browser request from a foreign origin is refused before any route runs",
  async () => {
    await withServer(async (base) => {
      const response =
        await fetch(
          `${base}/api/executive/approvals/a1/approve`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "https://evil.example",
            },
            body: JSON.stringify({ actorId: "eric" }),
          },
        );

      assert.equal(response.status, 403);
      assert.equal(
        (await response.json()).error,
        "runtime_origin_not_allowed",
      );

      const read =
        await fetch(
          `${base}/api/knowledge/education`,
          { headers: { origin: "https://evil.example" } },
        );

      assert.equal(read.status, 403);
    });
  },
);

test(
  "the Builder origin and origin-less local callers reach routes",
  async () => {
    await withServer(async (base) => {
      const fromBuilder =
        await fetch(
          `${base}/api/executive/approvals/a1/approve`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "http://localhost:8080",
            },
            body: JSON.stringify({ actorId: "eric" }),
          },
        );

      assert.equal(fromBuilder.status, 200);
      assert.equal(
        fromBuilder.headers.get("access-control-allow-origin"),
        "http://localhost:8080",
      );

      const fromCli =
        await fetch(
          `${base}/api/knowledge/education`,
        );

      assert.equal(fromCli.status, 200);
    });
  },
);

test(
  "agents cannot act on human-only executive routes",
  async () => {
    await withServer(async (base) => {
      for (const actorId of ["chief-agent", "engineer-agent", "agent:x"]) {
        const response =
          await fetch(
            `${base}/api/executive/approvals/a1/approve`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ actorId }),
            },
          );

        assert.equal(response.status, 403, actorId);
        assert.equal(
          (await response.json()).error,
          "executive_route_requires_human_actor",
        );
      }

      const accept =
        await fetch(
          `${base}/api/executive/delegations/d1/accept`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ actorId: "engineer-agent", actionId: "a1" }),
          },
        );

      assert.equal(accept.status, 200);
    });
  },
);

test(
  "executive routes refuse non-local callers without the Runtime token",
  () => {
    const previous =
      process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN;

    process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN =
      "test-token";

    try {
      const call = (
        remoteAddress: string,
        token?: string,
      ) => {
        let status = 0;
        let nextCalled = false;

        const req = {
          socket: { remoteAddress },
          header: (name: string) =>
            name === "x-korelumina-runtime-token" ? token : undefined,
        };

        const res = {
          status(code: number) {
            status = code;
            return this;
          },
          json() {
            return this;
          },
        };

        requireRuntimeAccess(
          req as never,
          res as never,
          () => {
            nextCalled = true;
          },
        );

        return { status, nextCalled };
      };

      assert.deepEqual(call("192.168.1.20"), { status: 403, nextCalled: false });
      assert.deepEqual(call("192.168.1.20", "wrong"), { status: 403, nextCalled: false });
      assert.deepEqual(call("192.168.1.20", "test-token"), { status: 0, nextCalled: true });
      assert.deepEqual(call("127.0.0.1"), { status: 0, nextCalled: true });
    } finally {
      if (previous === undefined) {
        delete process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN;
      } else {
        process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN = previous;
      }
    }
  },
);
