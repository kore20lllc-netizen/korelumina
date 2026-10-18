import assert from "node:assert/strict";
import test from "node:test";

import type {
  AddressInfo,
} from "node:net";

import express from "express";

import {
  CHIEF_AGENT_NOT_ACTIVATED_ERROR,
  ChiefAgentActivationGate,
  noChiefAgentActivationRecords,
  requireActiveChiefAgent,
  type ChiefAgentActivationRecordView,
} from "../index.js";

import {
  createExecutiveEvent,
} from "../../events/index.js";

import {
  createExecutiveOrchestrator,
} from "../../orchestrator/createExecutiveOrchestrator.js";

import {
  registerExecutiveActivationRoute,
} from "../../../routes/executiveActivation.js";

const record = (
  state: ChiefAgentActivationRecordView["state"],
) => ({
  latest: () => ({
    activationId: "chief-agent-activation:test",
    state,
    autonomyLevel: "PROPOSE_ONLY",
  }),
});

function architectureEvent(id: string) {
  return createExecutiveEvent({
    id,
    type: "architecture.review-requested",
    category: "architecture",
    source: "test",
    actor: { id: "human-review:repository-owner", type: "human" } as never,
    confidence: "validated",
    payload: {},
  });
}

test(
  "the gate is NOT_ACTIVATED when no activation has been recorded",
  () => {
    const decision =
      new ChiefAgentActivationGate(
        noChiefAgentActivationRecords,
        undefined,
        () => 42,
      ).evaluate();

    assert.equal(decision.state, "NOT_ACTIVATED");
    assert.equal(decision.active, false);
    assert.equal(decision.activationId, null);
    assert.equal(decision.checkedAt, 42);
  },
);

test(
  "only an ACTIVE activation record opens the gate",
  () => {
    assert.equal(new ChiefAgentActivationGate(record("ACTIVE")).evaluate().active, true);
    assert.equal(new ChiefAgentActivationGate(record("ACTIVE")).evaluate().autonomyLevel, "PROPOSE_ONLY");

    const suspended = new ChiefAgentActivationGate(record("SUSPENDED")).evaluate();
    assert.equal(suspended.state, "SUSPENDED");
    assert.equal(suspended.active, false);

    const revoked = new ChiefAgentActivationGate(record("REVOKED")).evaluate();
    assert.equal(revoked.state, "REVOKED");
    assert.equal(revoked.active, false);
  },
);

test(
  "the gate fails closed when activation state cannot be read",
  () => {
    const decision =
      new ChiefAgentActivationGate({
        latest: () => {
          throw new Error("disk unreadable");
        },
      }).evaluate();

    assert.equal(decision.state, "UNAVAILABLE");
    assert.equal(decision.active, false);
  },
);

test(
  "valid prerequisites are reported but never activate the gate",
  () => {
    const status =
      new ChiefAgentActivationGate(
        noChiefAgentActivationRecords,
        () => [
          { gate: "day-zero-certification", state: "VALID" },
          { gate: "production-workspace-authorization", state: "VALID" },
        ],
      ).status();

    assert.equal(status.state, "NOT_ACTIVATED");
    assert.equal(status.active, false);
    assert.equal(status.prerequisites?.length, 2);

    const broken =
      new ChiefAgentActivationGate(
        noChiefAgentActivationRecords,
        () => {
          throw new Error("store offline");
        },
      ).status();

    assert.deepEqual(broken.prerequisites, [{ gate: "prerequisites", state: "UNAVAILABLE" }]);
  },
);

test(
  "a gated handler never runs before activation and runs once active",
  async () => {
    let calls = 0;
    const handler = async () => {
      calls += 1;
    };

    await assert.rejects(
      requireActiveChiefAgent(
        new ChiefAgentActivationGate(noChiefAgentActivationRecords),
        handler,
      )({}),
      { message: CHIEF_AGENT_NOT_ACTIVATED_ERROR },
    );
    assert.equal(calls, 0);

    await requireActiveChiefAgent(
      new ChiefAgentActivationGate(record("ACTIVE")),
      handler,
    )({});
    assert.equal(calls, 1);
  },
);

test(
  "before activation the executive pipeline completes the event and records reasoning as refused",
  async () => {
    let reasoningCalls = 0;
    const runtime = createExecutiveOrchestrator();

    runtime.dispatcher.register(
      "reasoning",
      requireActiveChiefAgent(
        new ChiefAgentActivationGate(noChiefAgentActivationRecords),
        async () => {
          reasoningCalls += 1;
        },
      ),
    );

    const result =
      await runtime.orchestrator.publish(
        architectureEvent("event:gate:before"),
      );

    assert.equal(reasoningCalls, 0, "no model call before activation");
    assert.equal(result.lifecycle.stage, "completed");
    assert.equal(result.dispatch?.successful, true);

    const reasoning =
      result.dispatch?.records.find(
        (r) => r.destination === "reasoning",
      );

    assert.deepEqual(reasoning, {
      destination: "reasoning",
      status: "refused",
      message: CHIEF_AGENT_NOT_ACTIVATED_ERROR,
    });
  },
);

test(
  "once active the same event reaches Chief Agent reasoning",
  async () => {
    let reasoningCalls = 0;
    const runtime = createExecutiveOrchestrator();

    runtime.dispatcher.register(
      "reasoning",
      requireActiveChiefAgent(
        new ChiefAgentActivationGate(record("ACTIVE")),
        async () => {
          reasoningCalls += 1;
        },
      ),
    );

    const result =
      await runtime.orchestrator.publish(
        architectureEvent("event:gate:after"),
      );

    assert.equal(reasoningCalls, 1);
    assert.equal(result.lifecycle.stage, "completed");
    assert.equal(
      result.dispatch?.records.find((r) => r.destination === "reasoning")?.status,
      "handled",
    );
  },
);

test(
  "real handler failures are still failures, not refusals",
  async () => {
    const runtime = createExecutiveOrchestrator();

    runtime.dispatcher.register(
      "reasoning",
      requireActiveChiefAgent(
        new ChiefAgentActivationGate(record("ACTIVE")),
        async () => {
          throw new Error("model_unreachable");
        },
      ),
    );

    const result =
      await runtime.orchestrator.publish(
        architectureEvent("event:gate:broken"),
      );

    assert.equal(result.lifecycle.stage, "failed");
    assert.equal(
      result.dispatch?.records.find((r) => r.destination === "reasoning")?.status,
      "failed",
    );
  },
);

test(
  "the activation status route is read-only and reports the gate and prerequisites",
  async () => {
    const app = express();

    registerExecutiveActivationRoute(
      app,
      new ChiefAgentActivationGate(
        noChiefAgentActivationRecords,
        () => [{ gate: "day-zero-certification", state: "VALID" }],
      ),
    );

    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const { port } = server.address() as AddressInfo;

    try {
      const quick = await (await fetch(`http://127.0.0.1:${port}/api/executive/activation`)).json();
      assert.equal(quick.activation.prerequisites, null, "prerequisites only on request");

      const response = await fetch(`http://127.0.0.1:${port}/api/executive/activation?prerequisites=true`);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.activation.state, "NOT_ACTIVATED");
      assert.equal(body.activation.active, false);
      assert.deepEqual(body.activation.prerequisites, [{ gate: "day-zero-certification", state: "VALID" }]);

      const write = await fetch(`http://127.0.0.1:${port}/api/executive/activation`, { method: "PUT" });
      assert.equal(write.status, 404);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
