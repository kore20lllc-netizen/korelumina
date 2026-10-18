import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  readdirSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import type {
  AddressInfo,
} from "node:net";

import express from "express";

import {
  ChiefAgentActivationGate,
  ChiefAgentActivationService,
  FileChiefAgentActivationStore,
  requireActiveChiefAgent,
  type ChiefAgentActivationPrerequisite,
} from "../index.js";

import {
  registerExecutiveActivationRoute,
} from "../../../routes/executiveActivation.js";

const GATES = [
  "day-zero-certification",
  "educational-corpus-certification",
  "initial-competency-certification",
  "initial-competency-human-acceptance",
  "production-workspace-authorization",
];

function prerequisites(
  overrides: Record<string, string> = {},
): ChiefAgentActivationPrerequisite[] {
  return GATES.map((gate) => ({
    gate,
    state: overrides[gate] ?? "VALID",
    id: `${gate}:id-1`,
  }));
}

function setup(
  initial: Record<string, string> = {},
) {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-activation-"));
  const store = new FileChiefAgentActivationStore(root);
  let current = prerequisites(initial);
  let clock = 1000;
  const service = new ChiefAgentActivationService(store, () => current, () => clock++);
  const gate = new ChiefAgentActivationGate(store, () => current);

  return {
    root,
    store,
    service,
    gate,
    setPrerequisites: (overrides: Record<string, string>) => {
      current = prerequisites(overrides);
    },
  };
}

const owner = "human-review:repository-owner";
const why = "Owner decision recorded for the Chief Agent activation lifecycle.";

test(
  "activation previews without writing, then records when confirmed and opens the gate",
  () => {
    const { root, service, gate } = setup();

    const preview = service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why });
    assert.equal(preview.outcome, "PREVIEW");
    assert.equal(readdirSync(root).length, 0);
    assert.equal(gate.evaluate().state, "NOT_ACTIVATED");

    const recorded = service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(recorded.outcome, "RECORDED");
    assert.deepEqual(readdirSync(root), ["000001-activate.json"]);

    if (recorded.outcome !== "RECORDED") return;
    assert.equal(recorded.record.state, "ACTIVE");
    assert.equal(recorded.record.autonomyLevel, "PROPOSE_ONLY");
    assert.equal(recorded.record.authorityRole, "HUMAN_GOVERNANCE");
    assert.equal(recorded.record.bindings.dayZeroCertificationId, "day-zero-certification:id-1");
    assert.match(recorded.record.activationId, /^chief-agent-activation:/);

    const decision = gate.evaluate();
    assert.equal(decision.state, "ACTIVE");
    assert.equal(decision.activationId, recorded.record.activationId);
  },
);

test(
  "activation is refused unless every prerequisite is valid",
  () => {
    const { service } = setup({ "initial-competency-certification": "STALE" });

    const result = service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(result.outcome, "REFUSED");
    if (result.outcome !== "REFUSED") return;
    assert.deepEqual(result.reasons, ["initial-competency-certification-must-be-valid"]);
  },
);

test(
  "agents, missing reasons and higher autonomy levels are refused",
  () => {
    const { service } = setup();

    const agent = service.decide({ action: "ACTIVATE", decidedBy: "chief-agent", reason: why, confirm: true });
    assert.equal(agent.outcome, "REFUSED");
    if (agent.outcome === "REFUSED") assert.ok(agent.reasons.includes("activation-decisions-require-a-human-actor"));

    const noReason = service.decide({ action: "ACTIVATE", decidedBy: owner, reason: "ok", confirm: true });
    assert.equal(noReason.outcome, "REFUSED");

    const autonomy = service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, autonomyLevel: "EXECUTE", confirm: true });
    assert.equal(autonomy.outcome, "REFUSED");
    if (autonomy.outcome === "REFUSED") assert.ok(autonomy.reasons.includes("autonomy-level-must-be-PROPOSE_ONLY"));

    const unknown = service.decide({ action: "PROMOTE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(unknown.outcome, "REFUSED");
  },
);

test(
  "suspend, resume and revoke follow the lifecycle and drive the gate",
  async () => {
    const { root, service, gate, setPrerequisites } = setup();

    let reasoning = 0;
    const handler = requireActiveChiefAgent(gate, async () => {
      reasoning += 1;
    });

    assert.equal(service.decide({ action: "SUSPEND", decidedBy: owner, reason: why, confirm: true }).outcome, "REFUSED");

    service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true }).outcome, "REFUSED");
    await handler({});
    assert.equal(reasoning, 1);

    assert.equal(service.decide({ action: "SUSPEND", decidedBy: owner, reason: why, confirm: true }).outcome, "RECORDED");
    assert.equal(gate.evaluate().state, "SUSPENDED");
    await assert.rejects(handler({}), { message: "chief_agent_not_activated" });
    assert.equal(reasoning, 1);

    setPrerequisites({ "day-zero-certification": "BLOCKED" });
    assert.equal(service.decide({ action: "RESUME", decidedBy: owner, reason: why, confirm: true }).outcome, "REFUSED");

    setPrerequisites({ "day-zero-certification": "STALE" });
    const resumed = service.decide({ action: "RESUME", decidedBy: owner, reason: why, confirm: true });
    assert.equal(resumed.outcome, "RECORDED", "curriculum drift does not block resume");
    assert.equal(gate.evaluate().state, "ACTIVE");

    const revoked = service.decide({ action: "REVOKE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(revoked.outcome, "RECORDED");
    assert.equal(gate.evaluate().state, "REVOKED");

    assert.deepEqual(readdirSync(root).sort(), [
      "000001-activate.json",
      "000002-suspend.json",
      "000003-resume.json",
      "000004-revoke.json",
    ]);

    const history = service.history();
    assert.equal(new Set(history.map((r) => r.activationId)).size, 1, "one activation across its lifecycle");
    assert.equal(history.at(1)?.previousRecordId, history.at(0)?.recordId);

    setPrerequisites({});
    const again = service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(again.outcome, "RECORDED", "a revoked activation can be replaced by a new one");
    if (again.outcome === "RECORDED") assert.notEqual(again.record.activationId, history.at(0)?.activationId);
  },
);

test(
  "suspend and revoke never read the certifications",
  () => {
    const root = mkdtempSync(path.join(tmpdir(), "korelumina-activation-"));
    const store = new FileChiefAgentActivationStore(root);
    let reads = 0;
    const service = new ChiefAgentActivationService(store, () => {
      reads += 1;
      return prerequisites();
    });

    service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(reads, 1);

    service.decide({ action: "SUSPEND", decidedBy: owner, reason: why, confirm: true });
    service.decide({ action: "REVOKE", decidedBy: owner, reason: why, confirm: true });
    assert.equal(reads, 1, "emergency stop does not wait on certification reads");
  },
);

test(
  "a corrupt or tampered record makes the gate refuse",
  () => {
    const corrupt = setup();
    corrupt.service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
    writeFileSync(path.join(corrupt.root, "000001-activate.json"), "{ not json", "utf8");
    assert.equal(corrupt.gate.evaluate().state, "UNAVAILABLE");
    assert.equal(corrupt.gate.evaluate().active, false);

    const gap = setup();
    gap.service.decide({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
    writeFileSync(path.join(gap.root, "000003-suspend.json"), "{}", "utf8");
    assert.equal(gap.gate.evaluate().state, "UNAVAILABLE");
  },
);

test(
  "the activation route previews, records, refuses and reports history",
  async () => {
    const { service, gate } = setup();
    const app = express();
    app.use(express.json());
    registerExecutiveActivationRoute(app, gate, service);

    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const { port } = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/api/executive/activation`;
    const put = (body: unknown) =>
      fetch(url, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

    try {
      const preview = await put({ action: "ACTIVATE", decidedBy: owner, reason: why });
      assert.equal(preview.status, 200);
      assert.equal((await preview.json()).outcome, "PREVIEW");

      const refused = await put({ action: "ACTIVATE", decidedBy: "chief-agent", reason: why, confirm: true });
      assert.equal(refused.status, 409);

      const recorded = await put({ action: "ACTIVATE", decidedBy: owner, reason: why, confirm: true });
      const body = await recorded.json();
      assert.equal(recorded.status, 200);
      assert.equal(body.outcome, "RECORDED");
      assert.equal(body.activation.state, "ACTIVE");

      const status = await (await fetch(url)).json();
      assert.equal(status.activation.state, "ACTIVE");
      assert.equal(status.history.length, 1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
